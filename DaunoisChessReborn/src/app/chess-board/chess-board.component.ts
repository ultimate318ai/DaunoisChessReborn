import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {
  PieceSymbol,
  boardCellNotation,
  boardCellsType,
} from './services//chessTypes';
import { BoardService } from './services/board.service';
import { ChessService } from './services/chess.service';
import { Move } from 'chess.ts';

@Component({
  selector: 'app-chess-board',
  templateUrl: './chess-board.component.html',
  styleUrls: ['./chess-board.component.scss'],
})
export class ChessBoardComponent implements OnInit, OnChanges {
  @Input()
  public fen!: string;

  private pointedCells: string[] = [];
  private selectedFromPieceCell: string = '';
  private lastMove: Move = {
    to: '',
    from: '',
    color: 'w',
    flags: '',
    piece: 'b',
    san: '',
  }; // default wrong move for typing issue

  // promotions

  private isLastMovePromotion = false;
  private promotionCellName: string = '';

  constructor(
    private boardService: BoardService,
    private chessService: ChessService
  ) {}

  ngOnInit(): void {
    this.buildChessBoard();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const fenChanged = changes['fen'];
    if (fenChanged) this.buildChessBoard();
  }

  buildChessBoard(): void {
    this.boardService.UpdateBoardCells(this.fen);
  }

  piecePictureUrl(pieceSymbol: PieceSymbol) {
    return this.boardService.getUrlFromPieceSymbol(pieceSymbol);
  }

  get chessBoardCellsContents() {
    return this.boardService.getBoardCellsValues();
  }

  get chessBoardCellsKeys() {
    return this.boardService.getBoardCellsKeys();
  }

  get chessBoardPromotionSquare() {
    return this.promotionCellName;
  }

  private resetPointedCells(): void {
    this.boardService.changeCellPointedState(this.pointedCells, false);
    this.pointedCells = [];
  }

  private resetSelectedPiece(): void {
    this.selectedFromPieceCell = '';
  }

  private updateChessBoard(): void {
    this.fen = this.chessService.getGameFen();
    this.buildChessBoard();
  }

  private updateChessBoardLastMove(move: Move): void {
    this.lastMove = move;
  }

  get boardLastMoveFrom() {
    return this.lastMove.from;
  }

  get boardLastMoveTo() {
    return this.lastMove.to;
  }

  private potentialMoveEndsInPromotion(): boolean {
    const fromCellMoves = this.chessService.getMovesFromCell(
      this.selectedFromPieceCell as boardCellNotation
    );
    return (
      !!fromCellMoves.length &&
      fromCellMoves.every((move) =>
        this.chessService.moveInvolvesPromotion(move)
      )
    );
  }

  get potentialsPromotionsPieces(): Set<PieceSymbol> {
    const fromCellMoves = this.chessService.getMovesFromCell(
      this.selectedFromPieceCell as boardCellNotation
    );
    return new Set(
      fromCellMoves.flatMap((move) =>
        !!move.promotion ? [move.promotion] : []
      )
    );
  }

  promotionSquarePositionFromIndex(index: number): boardCellNotation {
    const promotionCellCoordinates =
      this.boardService.fromBoardCellLetterNotationToCoordinates(
        this.promotionCellName as boardCellNotation
      );
    return this.boardService.fromCoordinatesToBoardCellNotation([
      promotionCellCoordinates[0],
      this.chessService.whiteToPlay()
        ? promotionCellCoordinates[1] - index
        : promotionCellCoordinates[1] + index,
    ]);
  }

  onEmptyCellClick(cellClick: string) {
    if (this.selectedFromPieceCell && this.potentialMoveEndsInPromotion()) {
      this.isLastMovePromotion = true;
      this.promotionCellName = cellClick;
      return;
    }
    if (this.selectedFromPieceCell) {
      const move = this.chessService.applyChessMove(
        this.selectedFromPieceCell,
        cellClick
      );
      if (move) {
        this.updateChessBoardLastMove(move);
      }
    }
    this.resetPointedCells();
    this.resetSelectedPiece();
    this.updateChessBoard();
  }

  onCellClick(cellClicked: string): void {
    const moves = this.chessService.getMovesFromCell(
      cellClicked as boardCellNotation
    );

    if (this.selectedFromPieceCell && this.potentialMoveEndsInPromotion()) {
      this.isLastMovePromotion = true;
      this.promotionCellName = cellClicked;
      return;
    }
    if (this.selectedFromPieceCell) {
      const move = this.chessService.applyChessMove(
        this.selectedFromPieceCell,
        cellClicked
      );
      if (move !== null) {
        this.updateChessBoard();
        this.updateChessBoardLastMove(move);
      }
      this.resetSelectedPiece();
      this.resetPointedCells();
    }
    if (moves.length && !this.selectedFromPieceCell) {
      this.selectedFromPieceCell = moves[0].from;
    }
    this.updatePointedBoardCells(moves);
  }

  onPromotionPieceClick(
    cellClicked: string,
    promotionPiece: PieceSymbol
  ): void {
    const promotionMove = this.chessService.applyChessMove(
      this.selectedFromPieceCell,
      this.promotionCellName,
      promotionPiece
    );
    if (promotionMove) {
      this.updateChessBoard();
      this.updateChessBoardLastMove(promotionMove);
    }
    this.isLastMovePromotion = false;
    this.promotionCellName = '';
    this.resetSelectedPiece();
    this.resetPointedCells();
  }

  private updatePointedBoardCells(moves: Move[]): void {
    this.pointedCells = this.boardService
      .getBoardEntries()
      .filter((boardCell) => !!moves.find((move) => boardCell[0] === move.to))
      .map((boardCell) => boardCell[0]);
    this.boardService.changeCellPointedState(this.pointedCells, true);
  }

  isKingCellChecked(cell: {
    pieceSymbol: PieceSymbol | 'no piece';
    pointed: boolean;
  }): boolean {
    return this.chessService.isKingCellChecked(cell);
  }

  get openPromotionChoices() {
    return this.isLastMovePromotion;
  }
}
