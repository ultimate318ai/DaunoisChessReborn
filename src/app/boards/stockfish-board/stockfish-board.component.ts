import { CdkDragEnd, CdkDragStart } from '@angular/cdk/drag-drop';
import {
  Component,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { BehaviorSubject, forkJoin, mergeMap, Subject } from 'rxjs';
import { ChessboardArrowService } from '../chess-board-arrow/board-arrow.service';
import { BoardService } from '../services/board.service';
import {
  BoardInformation,
  chessApiService,
  Move,
} from '../services/chess.api.service';
import { boardCellNotation, PieceSymbol } from '../services/chessTypes';
import { mapToResolve } from '@angular/router';

@Component({
  selector: 'app-stockfish-board',
  templateUrl: './stockfish-board.component.html',
  styleUrls: ['./stockfish-board.component.scss'],
  standalone: false,
})
export class StockfishBoardComponent implements OnInit, OnChanges {
  @Input()
  public fen!: string;

  @Output()
  public moveMadeList: Array<Move> = new Array();

  private displayedMoves: Array<Move> = new Array();

  private stateValid: boolean = true;

  private pointedCells: string[] = [];
  selectedFromPieceCell: string = '';
  private lastMove: Move | null = null;

  private lastMoveIndex: number = -1;

  private isNextMoveAPromotion = false;
  private promotionCellName: string = '';

  updatePlayerTurnState = new Subject<void>();
  moveList: Move[] = [];

  boardInformation: BoardInformation | null = null;

  constructor(
    private boardService: BoardService,
    private chessService: chessApiService,
    private arrowService: ChessboardArrowService
  ) {
    this.updatePlayerTurnState
      .pipe(
        mergeMap(() =>
          forkJoin({
            moveList: this.chessService.fetchMoveList(),
            boardInformation: this.chessService.fetchBoardInformation(),
          })
        )
      )
      .subscribe(({ moveList, boardInformation }) => {
        this.moveList = moveList;
        this.boardInformation = boardInformation;
      });
  }

  ngOnInit(): void {
    this.chessService.updateFen(this.fen).subscribe(() => {
      this.buildChessBoard();
      this.arrowService.initializeCanvas();
      this.updatePlayerTurnState.next();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const fenChanged = changes['fen'];
    if (fenChanged) {
      this.buildChessBoard();
    }
  }

  getChessBoardMoveListFromCell(cell: string): Move[] {
    return this.moveList.filter((chessMove) => chessMove.from === cell);
  }

  isEndOfChessBoardMoveValid(toCell: string): boolean {
    return !!this.moveList.find(
      (chessMove) =>
        chessMove.from === this.selectedFromPieceCell && chessMove.to === toCell
    );
  }

  private isMoveAPromotion(move: Move): boolean {
    return move.promotion !== null;
  }

  getNextPotentialMoveFromCoordinateCells(
    from: string,
    to: string
  ): Move | undefined {
    return this.moveList.find(
      (chessMove) => chessMove.from === from && chessMove.to === to
    );
  }

  get playerTurn(): 'w' | 'b' {
    const fenPlayerTurnPart = this.fen.split(' ')[1];
    if (fenPlayerTurnPart !== 'w' && fenPlayerTurnPart !== 'b') {
      throw new Error('Fen is not valid.');
    }
    return fenPlayerTurnPart;
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

  private updateChessBoardLastMove(move: Move): void {
    this.lastMoveIndex++;
    this.lastMove = move;
  }

  get boardLastMoveFrom(): string {
    return this.lastMove !== null ? this.lastMove.from : '';
  }

  get boardLastMoveTo(): string {
    return this.lastMove !== null ? this.lastMove.to : '';
  }

  get potentialsPromotionsPieces(): Set<PieceSymbol> {
    return new Set(
      this.moveList
        .filter(
          (move) =>
            move.from === this.selectedFromPieceCell &&
            move.to === this.promotionCellName
        )
        .map((promotionMove) => promotionMove.promotion)
        .filter((promotionPieceSymbol) => !!promotionPieceSymbol)
    );
  }

  get openPromotionChoices() {
    return this.isNextMoveAPromotion;
  }

  promotionSquarePositionFromIndex(index: number): boardCellNotation {
    const promotionCellCoordinates =
      this.boardService.fromBoardCellLetterNotationToCoordinates(
        this.promotionCellName as boardCellNotation
      );
    return this.boardService.fromCoordinatesToBoardCellNotation([
      promotionCellCoordinates[0],
      this.playerTurn === 'w'
        ? promotionCellCoordinates[1] - index
        : promotionCellCoordinates[1] + index,
    ]);
  }

  private updatePointedBoardCells(moves: Move[]): void {
    this.boardService.changeCellPointedState(this.pointedCells, false);
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
    const whiteKingIsCheckInTurn =
      cellName.pieceSymbol === 'K' &&
      this.boardInformation !== null &&
      this.boardInformation.is_check &&
      this.boardInformation.turn === 'w';
    const blackKingIsCheckInTurn =
      cellName.pieceSymbol === 'k' &&
      this.boardInformation !== null &&
      this.boardInformation.is_check &&
      this.boardInformation.turn === 'b';
    return whiteKingIsCheckInTurn || blackKingIsCheckInTurn;
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

  onEmptyCellClick(cellClicked: string): void {
    if (!this.stateValid) return;
    if (this.selectedFromPieceCell) {
      const move = this.getNextPotentialMoveFromCoordinateCells(
        this.selectedFromPieceCell,
        cellClicked
      );
      console.log(move);
      if (move) {
        if (this.isMoveAPromotion(move)) {
          this.isNextMoveAPromotion = true;
          this.promotionCellName = cellClicked;
          return;
        }

        this.chessService
          .applyChessMove(move)
          .pipe(mergeMap(() => this.chessService.fetchFen()))
          .subscribe((newFen) => {
            this.fen = newFen;
            this.moveMadeList.push(move);
            this.displayedMoves.push(move);
            this.buildChessBoard();
            this.updateChessBoardLastMove(move);
            this.updatePlayerTurnState.next();
          });
      }
      this.resetPointedCells();
      this.resetSelectedPiece();
    }
  }

  onCellClick(cellClicked: string): void {
    if (!this.stateValid) return;
    const moves = this.getChessBoardMoveListFromCell(cellClicked);
    if (!this.selectedFromPieceCell) {
      this.selectedFromPieceCell = cellClicked;
      this.updatePointedBoardCells(moves);
      return;
    }

    if (this.selectedFromPieceCell) {
      const move = this.getNextPotentialMoveFromCoordinateCells(
        this.selectedFromPieceCell,
        cellClicked
      );
      if (move) {
        if (this.isMoveAPromotion(move)) {
          this.isNextMoveAPromotion = true;
          this.promotionCellName = cellClicked;
          return;
        }
        this.chessService
          .applyChessMove(move)
          .pipe(mergeMap(() => this.chessService.fetchFen()))
          .subscribe((newFen) => {
            this.fen = newFen;
            this.moveMadeList.push(move);
            this.displayedMoves.push(move);
            this.buildChessBoard();
            this.updateChessBoardLastMove(move);
            this.updatePlayerTurnState.next();
          });
      } else {
        this.selectedFromPieceCell = cellClicked;
        this.updatePointedBoardCells(moves);
      }
    }
  }

  onPromotionPieceClick(promotionPiece: PieceSymbol): void {
    console.log(promotionPiece);
    if (!this.stateValid) return;
    const move = this.getNextPotentialMoveFromCoordinateCells(
      this.selectedFromPieceCell,
      this.promotionCellName
    );
    if (!move) {
      return;
    }
    move.promotion = promotionPiece;
    this.chessService
      .applyChessMove(move)
      .pipe(mergeMap(() => this.chessService.fetchFen()))
      .subscribe((newFen) => {
        this.fen = newFen;
        this.moveMadeList.push(move);
        this.displayedMoves.push(move);
        this.buildChessBoard();
        this.updateChessBoardLastMove(move);
        this.updatePlayerTurnState.next();
      });
    this.isNextMoveAPromotion = false;
    this.promotionCellName = '';
    this.resetSelectedPiece();
    this.resetPointedCells();
  }

  onPieceDrag(event: CdkDragStart<any>) {
    if (!this.stateValid) return;
    const cellClicked = event.source.element.nativeElement.id;
    const moves = this.getChessBoardMoveListFromCell(cellClicked);
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
      return;
    }
    this.onEmptyCellClick(boardCell);
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
  // TODO: handle this from backend
  // @HostListener('document:wheel', ['$event'])
  // handleMouseWheel(event: WheelEvent) {
  //   if (event.deltaY > 0) {
  //     //scroll on bottom
  //     this.displayedMoves = this.displayedMoves.slice(0, -1);
  //     const move = this.chessService.undoLastChessMove();
  //     if (move) this.updateChessBoardLastMove(move);
  //     this.stateValid = false;
  //   } else {
  //     if (this.displayedMoves.length < this.moves.length) {
  //       this.displayedMoves = [
  //         ...this.displayedMoves,
  //         this.moves[this.displayedMoves.length],
  //       ];
  //       const move = this.displayedMoves[this.displayedMoves.length - 1];
  //       this.chessService.applyChessMove(move.from, move.to);
  //       this.updateChessBoardLastMove(move);
  //     } else {
  //       this.stateValid = true;
  //     }
  //   }
  //   this.updateChessBoard();
  // }
}
