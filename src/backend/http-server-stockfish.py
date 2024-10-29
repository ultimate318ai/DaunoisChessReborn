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
import chess
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

STOCKFISH_VARIANT_SETTINGS = {
    "Threads": 1,
    "Hash": 16,
    "Skill Level": 20,
    "VariantPath": "IA/Fairy-Stockfish/src/variants.ini",
    "UCI_Variant": "maharajah",
}  # TODO: use it for extra configuration of stockfish

IA_EXE_NAME = (
    "stockfish"
    if platform.system() != "Windows"
    else "fairy-stockfish-largeboard_x86-64.exe"
)

IA_EXE_FILE_PATH_SEP = "/" if platform.system() != "Windows" else "\\"


def __find_ia_path(target: str, path="", sep=IA_EXE_FILE_PATH_SEP):
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
__board = chess.Board(DEFAULT_FEN)
__stockfish = stockfish.Stockfish(str(__engine_path))
__stockfish.set_fen_position(DEFAULT_FEN)


@app.route("/fen", methods=["PUT", "GET"])
@cross_origin()
def fen():
    """Fen management for chess board"""
    if request.method == "PUT":
        __board.set_board_fen(request.form["fen"])
        return {"App/Inf": "Ok"}, 200
    if request.method == "GET":
        return {"fen": __board.fen()}, 200
    return {"App/Err:": "Method not Supported"}, 504


@app.route("/move", methods=["PUT", "GET"])
@cross_origin()
def move():
    """Move management on a chess board"""
    if request.method == "GET":
        stockfish_move = __stockfish.get_best_move()
        if stockfish_move:
            return {"App/Inf": "Ok", "value": stockfish_move}, 200
        return {"App/Inf": "Ok", "value": None}, 200
    if request.method == "PUT":
        move_object: dict[str, chess.Square] = json.loads(request.form["move"])
        move_ = chess.Move(
            from_square=move_object["from"],
            to_square=move_object["to"],
            promotion=move_object["promotion"],
        )
        __board.push(move_)
        return {"App/Inf": "Ok"}, 200
    return {"App/Err:": "Method not Supported"}, 504


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
                "to": f"{chr(97 + (move.from_square % 8))}{(move.from_square // 8)+1}",
                "promotion": move.promotion,
                "drop": move.drop,
            }
            for move in __board.legal_moves
        ],
    }, 200


@app.route("/boardInformation", methods=["GET"])
@cross_origin()
def board_information():
    """Current board state."""
    body = {
        "is_check": __board.is_check(),
        "turn": __board.turn,
    }
    return {"App/Inf": "Ok", "value": body}, 200
