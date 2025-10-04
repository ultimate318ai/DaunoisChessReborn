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

export type boardCells = Record<
  boardCellNotation,
  {
    pieceSymbol: PieceSymbol | null;
    pointed: boolean;
  }
>;

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

export const PieceSymbolList = [
  'p',
  'n',
  'b',
  'r',
  'q',
  'k',
  'P',
  'N',
  'B',
  'R',
  'Q',
  'K',
];
export const DEFAULT_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export type PlayerColorSymbol = 'w' | 'b';
