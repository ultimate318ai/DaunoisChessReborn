type PieceType =
  | 'PAWN'
  | 'PAWN'
  | 'KNIGHT'
  | 'BISHOP'
  | 'ROOK'
  | 'QUEEN'
  | 'KING';

type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

type PieceName = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';

type PiecePlayerColor = 'White' | 'black';

type Piece = {
  type: PieceType;
  playerColor: PiecePlayerColor;
  symbol: PieceSymbol;
  name: PieceName;
  pictureUrl: string;
};

function getUrlFromPieceType(piece: Piece): string {
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
