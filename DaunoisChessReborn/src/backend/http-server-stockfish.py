"""
Module for Backend API in chess game.
The purpose of this backend is to manage get on chess move and post on stockfish attributes change.
and put on fen changes.
"""

from dataclasses import dataclass
from http.server import HTTPServer, BaseHTTPRequestHandler
from math import inf
import json
import os
import io
import pathlib
import platform
import socket
from socketserver import BaseServer
from typing import Any
import chess
import stockfish


@dataclass
class StockFishMove:
    """Class Representing abstract stockfish chess move"""

    move: str
    centipawn: int | None
    mate: int | None


class Config:
    """Configuration for backend API."""

    BACKEND_PORT = 8080
    FRONTEND_PORT = 4200
    ORIGIN_IP_ADDRESS = f"http://localhost:{FRONTEND_PORT}"


class Server(BaseHTTPRequestHandler):
    """
    Server using stockfish to get the best moves from a fen given. Also used for chess variants.
    """

    __stockfish: stockfish.Stockfish
    __board: chess.Board
    __engine_path: pathlib.Path

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

    init_variables: bool = True

    def __init_variables(self) -> None:
        self.__board = chess.Board(self.DEFAULT_FEN)
        self.__find_ia_path(self.IA_EXE_NAME)
        # print(self.__engine_path)
        self.__stockfish = stockfish.Stockfish(str(self.__engine_path))
        self.__stockfish.set_fen_position(self.DEFAULT_FEN)
        self.init_variables = False

    def __find_ia_path(self, target: str, path="", sep=IA_EXE_FILE_PATH_SEP) -> None:
        """
        Find recursively the path of the IA engine.
        """
        if path == "":
            path = os.getcwd()
        list_files_only = [
            file
            for file in os.listdir(path)
            if os.path.isfile(os.path.join(path, file))
        ]
        list_dir_only = [
            directory
            for directory in os.listdir(path)
            if os.path.isdir(os.path.join(path, directory))
        ]
        matches = [file for file in list_files_only if file == target]

        if len(matches):
            engine_path = path + sep + matches[0]
            self.__engine_path = pathlib.Path(engine_path)
            return

        for d in list_dir_only:
            _path = path + sep + d
            self.__find_ia_path(target, path=_path, sep=sep)
            _path = ""

    def do_OPTIONS(self):
        self.send_response(200, "OK")
        self.send_header("Access-Control-Allow-Origin", Config.ORIGIN_IP_ADDRESS)
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Access-Control-Allow-Origin")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        """Handle a get for the backend API."""

        if self.init_variables:
            self.__init_variables()

        match self.path:
            case "/fen":
                stockfish_fen = self.__stockfish.get_fen_position()
                self.send_response(200, "OK")
                self.send_header(
                    "Access-Control-Allow-Origin", Config.ORIGIN_IP_ADDRESS
                )
                self.end_headers()
                self.wfile.write(json.dumps(f"{stockfish_fen}").encode())

            case "/move":
                stockfish_move = self.__stockfish.get_best_move()
                if stockfish_move:
                    self.send_response(200, "OK")
                else:
                    self.send_response(
                        200,
                        f"No Move found for fen : {self.__stockfish.get_fen_position()}",
                    )
                self.send_header(
                    "Access-Control-Allow-Origin", Config.ORIGIN_IP_ADDRESS
                )
                self.end_headers()
                self.wfile.write(json.dumps(f"move: {stockfish_move}").encode())

            case "/moves":
                stockfish_move_list = [
                    StockFishMove(
                        **{key.lower(): value for key, value in top_move.keys()}
                    )
                    for top_move in self.__stockfish.get_top_moves(
                        num_top_moves=inf.as_integer_ratio()[0]
                    )
                ]

                if stockfish_move_list:
                    self.send_response(200, "OK")
                else:
                    self.send_response(
                        200,
                        f"No Moves found for fen : {self.__stockfish.get_fen_position()}",
                    )
                self.send_header(
                    "Access-Control-Allow-Origin", Config.ORIGIN_IP_ADDRESS
                )
                self.end_headers()
                self.wfile.write(json.dumps(f"{stockfish_move_list}").encode())
            case "/boardInformation":

                board_state = {
                    "is_check": self.__board.is_check(),
                    "turn": self.__board.turn,
                }
                self.send_response(200, "OK")
                self.send_header(
                    "Access-Control-Allow-Origin", Config.ORIGIN_IP_ADDRESS
                )
                self.end_headers()
                self.wfile.write(json.dumps(f"{board_state}").encode())
            case _ as wrong_path:
                self.send_response(404, f"Path Not found {wrong_path}")
                self.send_header(
                    "Access-Control-Allow-Origin", Config.ORIGIN_IP_ADDRESS
                )
                self.end_headers()

    def do_POST(self):
        """Handle post in the backend API"""

        if self.init_variables:
            self.__init_variables()

        old_fen = self.__stockfish.get_fen_position()

        match self.path:
            case "/fen":
                bytes_received = int(self.headers["Content-Length"])
                new_fen: str = json.load(
                    io.BytesIO(self.rfile.read(bytes_received).replace(b"'", b'"'))
                ).get("fen", None)
                self.send_response(200, "OK")
                self.send_header(
                    "Access-Control-Allow-Origin", Config.ORIGIN_IP_ADDRESS
                )
                self.end_headers()
                self.wfile.write(
                    json.dumps(f"fen changed from [{old_fen}] to [{new_fen}]").encode()
                )
            case "/move":
                bytes_received = int(self.headers["Content-Length"])
                move_object = json.load(
                    io.BytesIO(self.rfile.read(bytes_received).replace(b"'", b'"'))
                )
                move = chess.Move(
                    from_square=move_object["from"],
                    to_square=move_object["to"],
                    promotion=move_object["promotion"],
                )
                self.__board.push(move)
                self.send_response(200, "OK")
                self.send_header(
                    "Access-Control-Allow-Origin", Config.ORIGIN_IP_ADDRESS
                )
                self.end_headers()
            case _ as wrong_path:
                self.send_response(404, f"Path Not found {wrong_path}")
                self.send_header(
                    "Access-Control-Allow-Origin", Config.ORIGIN_IP_ADDRESS
                )
                self.end_headers()


httpd = HTTPServer(("localhost", Config.BACKEND_PORT), Server)
print(f"Server listening on port {Config.BACKEND_PORT}")

httpd.serve_forever()
