"""
Module for Backend API in chess game.
The purpose of this backend is to manage get on chess move and post on stockfish attributes change.
and put on fen changes.
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os
import io
import pathlib
import platform
import stockfish


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

    def init_stockfish(self):
        """
        Initialize stockfish attributes and fen.
        """
        self.__find_ia_path(self.IA_EXE_NAME)
        print(self.__engine_path)
        self.__stockfish = stockfish.Stockfish(str(self.__engine_path))
        self.__stockfish.set_fen_position(self.DEFAULT_FEN)

    def do_OPTIONS(self):
        self.send_response(200, "OK")
        self.send_header("Access-Control-Allow-Origin", Config.ORIGIN_IP_ADDRESS)
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Access-Control-Allow-Origin")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        """Handle a get for the backend API."""
        if not "_Server__stockfish" in locals():
            self.init_stockfish()

        if self.path == "/move":
            stockfish_move = self.__stockfish.get_best_move()
            if stockfish_move:
                self.send_response(200, "OK")
            else:
                self.send_response(
                    404,
                    f"No Move found for fen : {self.__stockfish.get_fen_position()}",
                )
            self.send_header("Access-Control-Allow-Origin", Config.ORIGIN_IP_ADDRESS)
            self.end_headers()
            self.wfile.write(json.dumps(f"move: {stockfish_move}").encode())
        else:
            self.send_response(200, "OK")
            self.send_header("Access-Control-Allow-Origin", Config.ORIGIN_IP_ADDRESS)
            self.end_headers()

    def do_POST(self):
        """Handle post in the backend API"""
        if not "_Server__stockfish" in locals():
            self.init_stockfish()

        old_fen = self.__stockfish.get_fen_position()

        match self.path:
            case "/fen":
                bytes_received = int(self.headers["Content-Length"])
                new_fen: str = json.load(
                    io.BytesIO(self.rfile.read(bytes_received).replace(b"'", b'"'))
                ).get("fen", None)
            case _ as wrong_path:
                self.send_response(404, f"Path Not found {wrong_path}")
                self.send_header(
                    "Access-Control-Allow-Origin", Config.ORIGIN_IP_ADDRESS
                )
                self.end_headers()
                return
        self.send_response(200, "OK")
        self.send_header("Access-Control-Allow-Origin", Config.ORIGIN_IP_ADDRESS)
        self.end_headers()
        self.wfile.write(
            json.dumps(f"fen changed from [{old_fen}] to [{new_fen}]").encode()
        )


httpd = HTTPServer(("localhost", Config.BACKEND_PORT), Server)
print(f"Server listening on port {Config.BACKEND_PORT}")

httpd.serve_forever()
