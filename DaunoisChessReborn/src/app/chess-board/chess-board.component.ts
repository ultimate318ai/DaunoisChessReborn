import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {
  CdkDragEnd,
  CdkDragStart,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { PieceSymbol, boardCellNotation } from './services//chessTypes';
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

  get chessBoardCells() {
    return this.boardService.getBoardEntries();
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

  get openPromotionChoices() {
    return this.isLastMovePromotion;
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

  private updatePointedBoardCells(moves: Move[]): void {
    this.pointedCells = this.boardService
      .getBoardEntries()
      .filter((boardCell) => !!moves.find((move) => boardCell[0] === move.to))
      .map((boardCell) => boardCell[0]);
    this.boardService.changeCellPointedState(this.pointedCells, true);
  }

  isKingCellChecked(cellName: {
    pieceSymbol: PieceSymbol | 'no piece';
    pointed: boolean;
  }): boolean {
    return this.chessService.isKingCellChecked(cellName);
  }

  isCellOccupied(cellName: string): boolean {
    return (
      this.chessBoardCells.find(
        (chessBoardCell) =>
          chessBoardCell[0] === cellName &&
          chessBoardCell[1].pieceSymbol !== 'no piece'
      ) !== undefined
    );
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

  onPromotionPieceClick(promotionPiece: PieceSymbol): void {
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

  onPieceDrag(event: CdkDragStart<any>) {
    const cellClicked = event.source.element.nativeElement.id;
    const moves = this.chessService.getMovesFromCell(
      cellClicked as boardCellNotation
    );
    if (moves.length) {
      this.resetPointedCells();
      this.selectedFromPieceCell = cellClicked;
    }
    this.updatePointedBoardCells(moves);
  }

  onPieceDrop(event: CdkDragEnd<any>) {
    const { x, y } = event.dropPoint;

    console.log(x);
    console.log(y);

    const boardRow = Math.min(Math.max(Math.floor(x / 60), 0), 7); //TODO: height and with resizable in variable with multiple of 60 (ie 480)
    const boardColumn = 8 - Math.min(Math.max(Math.floor(y / 60), 0), 7);
    console.log(boardRow);
    console.log(boardColumn);

    const boardCell = this.boardService.fromCoordinatesToBoardCellNotation([
      boardRow,
      boardColumn,
    ]);
    console.log(boardCell);

    if (this.isCellOccupied(boardCell)) {
      this.onCellClick(boardCell);
      this.updateChessBoard();
      return;
    }
    this.onEmptyCellClick(boardCell);
    this.updateChessBoard();
  }
}
