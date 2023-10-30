import { Injectable } from '@angular/core';

export type boardCellLetterNotation = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export type boardCellDigitNotation = '1' | '2' |'3' | '4' | '5' | '6' | '7' | '8';

export type boardCellNotation = `${boardCellLetterNotation}${boardCellDigitNotation}`;

export type boardCellsType = {[k in boardCellNotation]?: PieceSymbol | "no piece"};//TODO: change "no piece"

type PieceType =
  | 'PAWN'
  | 'PAWN'
  | 'KNIGHT'
  | 'BISHOP'
  | 'ROOK'
  | 'QUEEN'
  | 'KING';

export type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'| 'P' | 'N' | 'B' | 'R' | 'Q' | 'K';

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
     * //TODO: parse fen and check
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
          for (let index = 1; index <= +fenRowItem; index++){
            cellName = `${this.fromNumberToBoardCellLetter(column + index)}${8 - row}` as boardCellNotation
            boardCells[cellName] = "no piece";
          }
          continue;
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

  getUrlFromPieceSymbol(pieceSymbol: PieceSymbol): string {
    /**
     * Get piece picture url using piece type and player color.
     * @param piece: The piece used to get the url from.
     * @returns url string for piece given.
     */
    const baseUrl = 'https://upload.wikimedia.org/wikipedia/commons';
    let pieceUrl;
    switch (pieceSymbol) {
      case 'p':
      case 'P':
        pieceUrl =
          pieceSymbol.toUpperCase() === pieceSymbol
            ? '/4/45/Chess_plt45.svg'
            : '/c/c7/Chess_pdt45.svg';
        return `${baseUrl}${pieceUrl}`;
        case 'n':
          case 'N':
            pieceUrl =
              pieceSymbol.toUpperCase() === pieceSymbol
            ? '/7/70/Chess_nlt45.svg'
            : '/e/ef/Chess_ndt45.svg';
        return `${baseUrl}${pieceUrl}`;
        case 'b':
          case 'B':
            pieceUrl =
              pieceSymbol.toUpperCase() === pieceSymbol
            ? '/b/b1/Chess_blt45.svg'
            : '/9/98/Chess_bdt45.svg';
        return `${baseUrl}${pieceUrl}`;
        case 'r':
          case 'R':
            pieceUrl =
              pieceSymbol.toUpperCase() === pieceSymbol
            ? '/7/72/Chess_rlt45.svg'
            : '/f/ff/Chess_rdt45.svg';
        return `${baseUrl}${pieceUrl}`;
        case 'q':
          case 'Q':
            pieceUrl =
              pieceSymbol.toUpperCase() === pieceSymbol
            ? '/1/15/Chess_qlt45.svg'
            : '/4/47/Chess_qdt45.svg';
        return `${baseUrl}${pieceUrl}`;
        case 'k':
          case 'K':
            pieceUrl =
              pieceSymbol.toUpperCase() === pieceSymbol
            ? '/4/42/Chess_klt45.svg'
            : '/f/f0/Chess_kdt45.svg';
        return `${baseUrl}${pieceUrl}`;
    }
  }
}
