import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  HostListener,
  Output,
} from '@angular/core';
import { CdkDragEnd, CdkDragStart } from '@angular/cdk/drag-drop';
import { PieceSymbol, boardCellNotation } from '../services/chessTypes';
import { BoardService } from '../services/board.service';
import { ChessService } from '../services/chess.service';
import { ChessboardArrowService } from '../chess-board-arrow/board-arrow.service';
import { Move } from 'chess.ts';
import { chessApiService } from '../services/chess.api.service';

@Component({
  selector: 'app-chess-board',
  templateUrl: './chess-board.component.html',
  styleUrls: ['./chess-board.component.scss'],
})
export class ChessBoardComponent implements OnInit, OnChanges {
  @Input()
  public fen!: string;

  @Output()
  public moves: Array<Move> = new Array();

  private displayedMoves: Array<Move> = new Array();

  private stateValid: boolean = true;

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
  private lastMoveIndex: number = -1;

  private isLastMovePromotion = false;
  private promotionCellName: string = '';

  constructor(
    private boardService: BoardService,
    private chessService: ChessService,
    private arrowService: ChessboardArrowService
  ) {}

  ngOnInit(): void {
    this.buildChessBoard();
    this.arrowService.initializeCanvas();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const fenChanged = changes['fen'];
    if (fenChanged) {
      this.chessService.restartChessGame(fenChanged.currentValue);
      this.buildChessBoard();
    }
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
    this.lastMoveIndex++;
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
    if (!this.stateValid) return;
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
        this.moves.push(move);
        this.displayedMoves.push(move);
        this.updateChessBoardLastMove(move);
      }
    }
    this.resetPointedCells();
    this.resetSelectedPiece();
    this.updateChessBoard();
  }

  onCellClick(cellClicked: string): void {
    if (!this.stateValid) return;
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
      if (move) {
        this.moves.push(move);
        this.displayedMoves.push(move);
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
    if (!this.stateValid) return;
    const promotionMove = this.chessService.applyChessMove(
      this.selectedFromPieceCell,
      this.promotionCellName,
      promotionPiece
    );
    if (promotionMove) {
      this.moves.push(promotionMove);
      this.displayedMoves.push(promotionMove);
      this.updateChessBoard();
      this.updateChessBoardLastMove(promotionMove);
    }
    this.isLastMovePromotion = false;
    this.promotionCellName = '';
    this.resetSelectedPiece();
    this.resetPointedCells();
  }

  onPieceDrag(event: CdkDragStart<any>) {
    if (!this.stateValid) return;
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
    if (!this.stateValid) return;
    const { x, y } = event.dropPoint;

    const boardRow = Math.min(Math.max(Math.floor(x / 60), 0), 7); //TODO: height and with resizable in variable with multiple of 60 (ie 480)
    const boardColumn = 8 - Math.min(Math.max(Math.floor(y / 60), 0), 7);

    const boardCell = this.boardService.fromCoordinatesToBoardCellNotation([
      boardRow,
      boardColumn,
    ]);

    if (this.isCellOccupied(boardCell)) {
      this.onCellClick(boardCell);
      this.updateChessBoard();
      return;
    }
    this.onEmptyCellClick(boardCell);
    this.updateChessBoard();
  }

  dispatchEventToChessBoard(event: any) {
    //TODO: use this when I have understood event dispatch from canvas
    event.stopPropagation();
    console.log('high', event);
    const cusEvent = new MouseEvent(event, {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    // lowElmRef.dispatchEvent(cusEvent);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent) {
    this.arrowService.manageKeyPressed(event);
  }

  @HostListener('document:mousedown', ['$event'])
  handleMouseDown(event: MouseEvent) {
    this.arrowService.drawBoardLightCircle(event);
  }

  @HostListener('document:mouseup', ['$event'])
  handleMouseUp(event: MouseEvent) {
    this.arrowService.drawBoardFullCircle(event);
  }

  @HostListener('document:mousemove', ['$event'])
  handleMouseMove(event: MouseEvent) {
    this.arrowService.drawingArrow(event);
  }

  @HostListener('document:contextmenu', ['$event'])
  handleContextMenu(event: any) {
    event.preventDefault();
  }

  @HostListener('document:wheel', ['$event'])
  handleMouseWheel(event: WheelEvent) {
    if (event.deltaY > 0) {
      //scroll on bottom
      this.displayedMoves = this.displayedMoves.slice(0, -1);
      const move = this.chessService.undoLastChessMove();
      if (move) this.updateChessBoardLastMove(move);
      this.stateValid = false;
    } else {
      if (this.displayedMoves.length < this.moves.length) {
        this.displayedMoves = [
          ...this.displayedMoves,
          this.moves[this.displayedMoves.length],
        ];
        const move = this.displayedMoves[this.displayedMoves.length - 1];
        this.chessService.applyChessMove(move.from, move.to);
        this.updateChessBoardLastMove(move);
      } else {
        this.stateValid = true;
      }
    }
    this.updateChessBoard();
  }
}
