export type boardCellLetterNotation =
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h';

export type boardCellDigitNotation =
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8';

export type boardCellNotation =
  `${boardCellLetterNotation}${boardCellDigitNotation}`;

export type boardCellsType = {
  [k: string]: { pieceSymbol: PieceSymbol | 'no piece'; pointed: boolean };
}; //TODO: change "no piece"

export type PieceSymbol =
  | 'p'
  | 'n'
  | 'b'
  | 'r'
  | 'q'
  | 'k'
  | 'P'
  | 'N'
  | 'B'
  | 'R'
  | 'Q'
  | 'K';

export type PlayerColor = 'w' | 'b';

export class DaunoisChessError extends Error {
  constructor(msg: string) {
    super(msg);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, DaunoisChessError.prototype);
  }
}
