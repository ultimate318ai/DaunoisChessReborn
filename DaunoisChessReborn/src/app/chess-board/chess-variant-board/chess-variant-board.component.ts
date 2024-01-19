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
import { PieceSymbol, BoardCellNotation } from '../services/chessTypes';
import { BoardService } from '../services/board.service';
import { ChessboardArrowService } from '../../chess-board-arrow/board-arrow.service';
import { Move } from 'chess.ts';
import { ChessVariantsService } from '../services/chess-variants.service';
import { ChessVariant } from 'src/app/game-menu/gameSettings';
@Component({
  selector: 'app-chess-variant-board',
  templateUrl: './chess-variant-board.component.html',
  styleUrls: ['./chess-variant-board.component.scss'],
})
export class ChessVariantBoardComponent implements OnInit, OnChanges {
  @Input()
  public fen!: string;

  @Input()
  public variant!: ChessVariant;

  @Output()
  public moves: Array<string> = new Array();

  private displayedMoves: Array<string> = new Array();

  private stateValid: boolean = true;

  private pointedCells: string[] = [];
  private selectedFromPieceCell: string = '';
  private lastMove: string = '';
  private lastMoveIndex: number = -1;

  private isLastMovePromotion = false;
  private promotionCellName: string = '';

  constructor(
    private boardService: BoardService,
    private chessVariantService: ChessVariantsService,
    private arrowService: ChessboardArrowService
  ) {}

  ngOnInit(): void {
    this.buildChessBoard();
    this.arrowService.initializeCanvas();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const fenChanged = changes['fen'];
    if (fenChanged) {
      this.chessVariantService.restartChessGame(
        fenChanged.currentValue,
        this.variant
      );
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
    this.fen = this.chessVariantService.getGameFen();
    this.buildChessBoard();
  }

  private updateChessBoardLastMove(move: string): void {
    this.lastMoveIndex++;
    this.lastMove = move;
  }

  get boardLastMoveFrom() {
    return this.lastMove;
  }

  get boardLastMoveTo() {
    return this.lastMove;
  }

  get potentialsPromotionsPieces(): Set<PieceSymbol> {
    const fromCellMoves = this.chessVariantService.getMovesSanFromCell(
      this.selectedFromPieceCell as BoardCellNotation
    );
    return new Set(
      fromCellMoves.flatMap((move) => {
        const { promotion } = this.chessVariantService.sanToMove(move);

        return !!promotion ? [promotion] : [];
      })
    );
  }

  get openPromotionChoices() {
    return this.isLastMovePromotion;
  }

  private potentialMoveEndsInPromotion(): boolean {
    const fromCellMoves = this.chessVariantService.getMovesSanFromCell(
      this.selectedFromPieceCell as BoardCellNotation
    );
    return (
      !!fromCellMoves.length &&
      fromCellMoves.every((move) =>
        this.chessVariantService.moveSanInvolvesPromotion(move)
      )
    );
  }

  promotionSquarePositionFromIndex(index: number): BoardCellNotation {
    const promotionCellCoordinates =
      this.boardService.fromBoardCellLetterNotationToCoordinates(
        this.promotionCellName as BoardCellNotation
      );
    return this.boardService.fromCoordinatesToBoardCellNotation([
      promotionCellCoordinates[0],
      this.chessVariantService.whiteToPlay()
        ? promotionCellCoordinates[1] - index
        : promotionCellCoordinates[1] + index,
    ]);
  }

  private updatePointedBoardCells(moves: string[]): void {
    this.pointedCells = this.boardService
      .getBoardEntries()
      .filter(
        (boardCell) =>
          !!moves
            .map((sanMove) => this.chessVariantService.sanToMove(sanMove))
            .find((move) => boardCell[0] === move.to)
      )
      .map((boardCell) => boardCell[0]);
    this.boardService.changeCellPointedState(this.pointedCells, true);
  }

  isKingCellChecked(cellName: {
    pieceSymbol: PieceSymbol | 'no piece';
    pointed: boolean;
  }): boolean {
    return this.chessVariantService.isKingCellChecked(cellName);
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
      const moveSan = this.chessVariantService.coordinatesToMoveSan(
        this.selectedFromPieceCell,
        cellClick
      );
      if (moveSan) {
        this.chessVariantService.applyChessMoveSan(moveSan);
        this.moves.push(moveSan);
        this.displayedMoves.push(moveSan);
        this.updateChessBoardLastMove(moveSan);
      }
    }
    this.resetPointedCells();
    this.resetSelectedPiece();
    this.updateChessBoard();
  }

  onCellClick(cellClicked: string): void {
    if (!this.stateValid) return;
    const moves = this.chessVariantService.getMovesSanFromCell(
      cellClicked as BoardCellNotation
    );

    if (this.selectedFromPieceCell && this.potentialMoveEndsInPromotion()) {
      this.isLastMovePromotion = true;
      this.promotionCellName = cellClicked;
      return;
    }
    if (this.selectedFromPieceCell) {
      const moveSan = this.chessVariantService.coordinatesToMoveSan(
        this.selectedFromPieceCell,
        cellClicked
      );
      if (moveSan) {
        this.chessVariantService.applyChessMoveSan(moveSan);
        this.moves.push(moveSan);
        this.displayedMoves.push(moveSan);
        this.updateChessBoard();
        this.updateChessBoardLastMove(moveSan);
      }
      this.resetSelectedPiece();
      this.resetPointedCells();
    }
    if (moves.length && !this.selectedFromPieceCell) {
      this.selectedFromPieceCell = this.chessVariantService.sanToMove(
        moves[0]
      ).from;
    }
    this.updatePointedBoardCells(moves);
  }

  onPromotionPieceClick(promotionPiece: PieceSymbol): void {
    if (!this.stateValid) return;
    const promotionMove = this.chessVariantService.coordinatesToMoveSan(
      this.selectedFromPieceCell,
      this.promotionCellName
    );

    if (promotionMove) {
      this.chessVariantService.applyChessMoveSan(promotionMove);
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
    const moves = this.chessVariantService.getMovesSanFromCell(
      cellClicked as BoardCellNotation
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
      const move = this.chessVariantService.undoLastChessMove();
      if (move) this.updateChessBoardLastMove(move);
      this.stateValid = false;
    } else {
      if (this.displayedMoves.length < this.moves.length) {
        this.displayedMoves = [
          ...this.displayedMoves,
          this.moves[this.displayedMoves.length],
        ];
        const move = this.displayedMoves[this.displayedMoves.length - 1];
        this.chessVariantService.applyChessMoveSan(move);
        this.updateChessBoardLastMove(move);
      } else {
        this.stateValid = true;
      }
    }
    this.updateChessBoard();
  }
}
