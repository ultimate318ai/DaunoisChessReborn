"""
Module for Backend API in chess game.
The purpose of this backend is to manage get on chess move and post on stockfish attributes change.
and put on fen changes.
"""

from dataclasses import dataclass

import json
import os
import pathlib
import platform
from typing import Any
from chess import Board, Move, parse_square, PIECE_SYMBOLS
import stockfish

from flask import Flask, request
from flask_cors import CORS, cross_origin


@dataclass
class StockFishMove:
    """Class Representing abstract stockfish chess move"""

    move_san: str
    centipawn: int | None
    mate: int | None


BACKEND_PORT = 8080
FRONTEND_PORT = 4200
ORIGIN_IP_ADDRESS = f"http://localhost:{FRONTEND_PORT}"

DEFAULT_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 "

DEFAULT_STOCKFISH_SETTINGS = {
    "Threads": 1,
    "Hash": 16,
    "Skill Level": 1,
    # "VariantPath": "IA/Fairy-Stockfish/src/variants.ini",
    # "UCI_Variant": "maharajah",// TODO: use with variants
}

IA_EXE_NAME = (
    "stockfish"
    if platform.system() != "Windows"
    else "fairy-stockfish-largeboard_x86-64.exe"
)

IA_EXE_FILE_PATH_SEP = "/" if platform.system() != "Windows" else "\\"


def __find_ia_path(target: str, path: str = "", sep: str = IA_EXE_FILE_PATH_SEP):
    """
    Find recursively the path of the IA engine.
    """
    if path == "":
        path = os.getcwd()
    list_files_only = [
        file for file in os.listdir(path) if os.path.isfile(os.path.join(path, file))
    ]
    list_dir_only = [
        directory
        for directory in os.listdir(path)
        if os.path.isdir(os.path.join(path, directory))
    ]
    matches = [file for file in list_files_only if file == target]

    if len(matches):
        engine_path = path + sep + matches[0]
        yield pathlib.Path(engine_path)

    for d in list_dir_only:
        _path = path + sep + d
        yield from __find_ia_path(target, path=_path, sep=sep)


app = Flask(__name__)
cors = CORS(app)
app.config["CORS_HEADERS"] = "Content-Type"

__engine_path = next(__find_ia_path(IA_EXE_NAME))
__board = Board(DEFAULT_FEN)
__stockfish = stockfish.Stockfish(str(__engine_path))
__stockfish.set_fen_position(DEFAULT_FEN)


@app.route("/fen", methods=["PUT", "GET"])
@cross_origin()
def fen():
    """Fen management for chess board"""
    if request.method == "PUT":
        _fen = request.get_data().decode()
        __board.set_fen(f"{_fen}")
        app.logger.debug("fen updated to %s", _fen)
        return {"App/Inf": "Ok"}, 200
    if request.method == "GET":
        app.logger.debug("GET /fen: %s", __board.fen())
        return {"App/Inf": "Ok", "value": __board.fen()}, 200
    return {"App/Err": "Method not Supported"}, 504


@app.route("/move", methods=["PUT", "GET", "DELETE", "POST"])
@cross_origin()
def move():
    """Move management on a chess board"""

    if request.method == "GET":
        stockfish_move = __stockfish.get_best_move()
        if stockfish_move:
            return {"App/Inf": "Ok", "value": stockfish_move}, 200
        return {"App/Inf": "Ok", "value": None}, 200
    if request.method == "PUT":
        move_object: dict[str, str | None] = request.get_json()
        from_ = move_object.get("from", None)
        to_ = move_object.get("to", None)
        promotion = move_object.get("promotion", None)
        if from_ is None or to_ is None:
            return {"App/Err": f"wrong from or to for move {move_object}"}, 400
        move_ = Move(
            from_square=parse_square(from_),
            to_square=parse_square(to_),
            promotion=(PIECE_SYMBOLS.index(promotion.lower()) if promotion else None),
        )
        __board.push(move_)
        __stockfish.set_fen_position(__board.fen())
        return {"App/Inf": "Ok"}, 200
    if request.method == "DELETE":
        try:
            last_move = __board.pop()
            __stockfish.set_fen_position(__board.fen())
            return {"App/Inf": "Ok", "value": last_move}, 200
        except IndexError:
            return {"App/Inf": "Ok", "value": None}, 200

    if request.method == "POST":
        best_move_as_uci_string = __stockfish.get_best_move()
        if not best_move_as_uci_string:
            return {"App/Inf": "Ok", "value": None}, 200
        best_move = Move.from_uci(best_move_as_uci_string)
        __board.push(best_move)
        __stockfish.set_fen_position(__board.fen())

        return {
            "App/Inf": "Ok",
            "value": {
                "uci": best_move.uci(),
                "from": f"{chr(97 + (best_move.from_square % 8))}{(best_move.from_square // 8)+1}",
                "to": f"{chr(97 + (best_move.to_square % 8))}{(best_move.to_square // 8)+1}",
                "promotion": (
                    PIECE_SYMBOLS[best_move.promotion].upper()
                    if best_move.promotion and __board.turn
                    else (
                        PIECE_SYMBOLS[best_move.promotion]
                        if best_move.promotion
                        else None
                    )
                ),
                "drop": best_move.drop,
                "isEnPassant": __board.is_en_passant(best_move),
            },
        }, 200
    return {"App/Err": "Method not Supported"}, 504


@app.route("/moves", methods=["GET"])
@cross_origin()
def moves():
    """Get top moves from board in a position given."""
    return {
        "App/Inf": "Ok",
        "value": [
            {
                "uci": move.uci(),
                "from": f"{chr(97 + (move.from_square % 8))}{(move.from_square // 8)+1}",
                "to": f"{chr(97 + (move.to_square % 8))}{(move.to_square // 8)+1}",
                "promotion": (
                    PIECE_SYMBOLS[move.promotion].upper()
                    if move.promotion and __board.turn
                    else PIECE_SYMBOLS[move.promotion] if move.promotion else None
                ),
                "drop": move.drop,
                "isEnPassant": __board.is_en_passant(move),
            }
            for move in __board.legal_moves
        ],
    }, 200


@app.route("/boardInformation", methods=["GET", "DELETE", "PUT"])
@cross_origin()
def board_information():
    """Current board state."""
    app.logger.debug("Board Fen: %s", __board.fen())
    app.logger.debug("Board State:\n%s\n", __board.unicode(invert_color=True))
    if request.method == "GET":
        body = {
            "is_check": __board.is_check(),
            "turn": "w" if __board.turn else "b",
            "game_over": __board.is_game_over(),
        }
        app.logger.debug("GET /boardInformation : %s", json.dumps(body))
        return {"App/Inf": "Ok", "value": body}, 200
    if request.method == "DELETE":
        __board.reset_board()
        __stockfish.set_fen_position(DEFAULT_FEN)
        app.logger.debug("DELETE /boardInformation : Board reset")
        return {"App/Inf": "Ok"}, 200
    if request.method == "PUT":
        __board.apply_mirror()
        __stockfish.set_fen_position(__board.fen())
        app.logger.debug(
            "boardInformation : board flipped, new fen : %s", json.dumps(__board.fen())
        )
        return {"App/Inf": "Ok"}, 200
    return {"App/Err": "Method not Supported"}, 504


@app.route("/stockfishParameters", methods=["GET", "PATCH"])
@cross_origin()
def stockfish_parameters():
    """Endpoint for stockfish parameters, such as variant name or skill level"""
    if request.method == "GET":
        return {"App/Inf": "Ok", "value": __stockfish.get_parameters()}, 200
    if request.method == "PATCH":
        data = request.get_data().decode()
        data_as_object: dict[str, Any] = json.loads(data)
        settings = {
            key: value
            for key, value in data_as_object.items()
            if key in DEFAULT_STOCKFISH_SETTINGS
        }
        __stockfish.update_engine_parameters(settings)
        app.logger.debug(
            "Stockfish parameters set : %s, from %s",
            json.dumps(settings),
            json.dumps(data_as_object),
        )
        return {"App/Inf": "Ok"}, 200
    return {"App/Err": "Method not Supported"}, 504
