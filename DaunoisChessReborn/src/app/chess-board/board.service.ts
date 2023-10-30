import { Injectable } from '@angular/core';

export type boardCellLetterNotation = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export type boardCellDigitNotation = '1' | '2' |'3' | '4' | '5' | '6' | '7' | '8';

export type boardCellNotation = `${boardCellLetterNotation}${boardCellDigitNotation}`;

export type boardCellsType = {[k in boardCellNotation]?: PieceSymbol | null};

type PieceType =
  | 'PAWN'
  | 'PAWN'
  | 'KNIGHT'
  | 'BISHOP'
  | 'ROOK'
  | 'QUEEN'
  | 'KING';

export type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export type PieceName = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';

export type PiecePlayerColor = 'White' | 'black';

export type Piece = {
  type: PieceType;
  playerColor: PiecePlayerColor;
  symbol: PieceSymbol;
  name: PieceName;
  pictureUrl: string;
};

@Injectable({
  providedIn: 'root'
})
export class BoardService {

  constructor() {
  }

  public fromFenToCellsBoards(fen: string): boardCellsType {
    /**
     * Put fen pieces into board cells.
     * Fen is like this : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
     */
    const boardCells: boardCellsType = {}
    const boardPartFen = fen.split(" ")[0];
    let row = 0;
    let column = 0;
    let cellName: boardCellNotation;
    for (let fenRow of boardPartFen.split("/")){
      column = 0;
      for (let fenRowItem of fenRow){
        if (!isNaN(parseFloat(fenRowItem))){
          column += +fenRowItem;
          continue
        }
        cellName = `${this.fromNumberToBoardCellLetter(column)}${8 - row}` as boardCellNotation
        boardCells[cellName] = fenRowItem as PieceSymbol
        column++;
      }
      row++;
    }
    return boardCells;
  }
  private fromNumberToBoardCellLetter(index: number): boardCellLetterNotation {
    return String.fromCharCode(65 + index) as boardCellLetterNotation;
  }

  private fromBoardCellLetterToNumber(letter: boardCellLetterNotation): number {
    return letter.charCodeAt(0) - 65;
  }

  getUrlFromPieceType(piece: Piece): string {
    /**
     * Get piece picture url using piece type and player color.
     * @param piece: The piece used to get the url from.
     * @returns url string for piece given.
     */
    const baseUrl = 'https://upload.wikimedia.org/wikipedia/commons';
    let pieceUrl;
    switch (piece.type) {
      case 'PAWN':
        pieceUrl =
          piece.playerColor === 'White'
            ? '/4/45/Chess_plt45.svg'
            : '/c/c7/Chess_pdt45.svg';
        return `${baseUrl}${pieceUrl}`;
      case 'KNIGHT':
        pieceUrl =
          piece.playerColor === 'White'
            ? '/7/70/Chess_nlt45.svg'
            : '/e/ef/Chess_ndt45.svg';
        return `${baseUrl}${pieceUrl}`;
      case 'BISHOP':
        pieceUrl =
          piece.playerColor === 'White'
            ? '/b/b1/Chess_blt45.svg'
            : '/9/98/Chess_bdt45.svg';
        return `${baseUrl}${pieceUrl}`;
      case 'ROOK':
        pieceUrl =
          piece.playerColor === 'White'
            ? '/7/72/Chess_rlt45.svg'
            : '/f/ff/Chess_rdt45.svg';
        return `${baseUrl}${pieceUrl}`;
      case 'QUEEN':
        pieceUrl =
          piece.playerColor === 'White'
            ? '/1/15/Chess_qlt45.svg'
            : '/4/47/Chess_qdt45.svg';
        return `${baseUrl}${pieceUrl}`;
      case 'KING':
        pieceUrl =
          piece.playerColor === 'White'
            ? '/4/42/Chess_klt45.svg'
            : '/f/f0/Chess_kdt45.svg';
        return `${baseUrl}${pieceUrl}`;
    }
  }
}
