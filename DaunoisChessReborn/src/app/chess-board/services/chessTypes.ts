export type boardCellLetterNotation = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';

export type boardCellDigitNotation = '1' | '2' |'3' | '4' | '5' | '6' | '7' | '8';

export type boardCellNotation = `${boardCellLetterNotation}${boardCellDigitNotation}`;

export type boardCellsType = {[k in boardCellNotation]?: PieceSymbol | "no piece"};//TODO: change "no piece"

export type PieceType =
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