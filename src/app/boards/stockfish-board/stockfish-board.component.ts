import {
  CdkDrag,
  CdkDragEnd,
  CdkDragPlaceholder,
  CdkDragStart,
  CdkDropList,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { forkJoin, mergeMap, Subject } from 'rxjs';
import { ChessboardArrowService } from '../chess-board-arrow/board-arrow.service';
import { BoardService } from '../services/board.service';
import {
  BoardInformation,
  BoardMove,
  chessApiService,
  Move,
} from '../services/chess.api.service';
import { boardCellNotation, PieceSymbol } from '../services/chessTypes';
import { JsonPipe, NgStyle } from '@angular/common';
import { MoveBoardComponent } from 'src/app/move-board/move-board.component';

@Component({
  selector: 'app-stockfish-board',
  templateUrl: './stockfish-board.component.html',
  styleUrls: ['./stockfish-board.component.scss'],
  imports: [
    JsonPipe,
    NgStyle,
    DragDropModule,
    MoveBoardComponent,
    CdkDragPlaceholder,
    CdkDropList,
    CdkDrag,
  ],
})
export class StockfishBoardComponent implements OnInit, OnChanges {
  @Input()
  public fen!: string;

  @Output()
  public moveMadeList: Array<Move> = new Array();

  private displayedMoves: Array<BoardMove> = new Array();

  private pointedCells: string[] = [];

  private stateValid: boolean = true;
  private isNextMoveAPromotion = false;

  updatePlayerTurnState = new Subject<void>();
  selectedFromPieceCell: string = '';
  promotionCellName: string = '';
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
      this.boardService.updateBoardCells(this.fen);
      this.arrowService.initializeCanvas();
      this.updatePlayerTurnState.next();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const fenChanged = changes['fen'];
    if (fenChanged) {
      this.boardService.updateBoardCells(this.fen);
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
    this.boardService.setPointedCellListState(this.pointedCells, false);
    this.pointedCells = [];
  }

  private resetSelectedPiece(): void {
    this.selectedFromPieceCell = '';
  }

  get lastMove(): Move | null {
    return this.displayedMoves[this.displayedMoves.length - 1] ?? null;
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
    this.boardService.setPointedCellListState(this.pointedCells, false);
    this.pointedCells = this.boardService
      .getBoardEntries()
      .filter((boardCell) => !!moves.find((move) => boardCell[0] === move.to))
      .map((boardCell) => boardCell[0]);
    this.boardService.setPointedCellListState(this.pointedCells, true);
  }

  isKingCellChecked(cellName: {
    pieceSymbol: PieceSymbol | null;
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
          chessBoardCell[1].pieceSymbol !== null
      ) !== undefined
    );
  }

  onEmptyCellClick(cellClicked: string): void {
    console.log('blblbll');
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
            this.displayedMoves.push({
              ...move,
              capturedPiece: this.boardService.getBoardCellPieceSymbol(move.to),
            });
            this.boardService.updateBoardCells(this.fen);
            this.updatePlayerTurnState.next();
          });
      } else {
        this.boardService.updateBoardCells(this.fen);
      }
      this.resetPointedCells();
      this.resetSelectedPiece();
    }
  }

  onCellClick(cellClicked: string): void {
    console.log('on cell vlick');
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
            this.displayedMoves.push({
              ...move,
              capturedPiece: this.boardService.getBoardCellPieceSymbol(move.to),
            });
            this.boardService.updateBoardCells(this.fen);
            this.updatePlayerTurnState.next();
          });
      } else {
        console.log('lvlvllklf hdklmq jsdklmj ');
        this.boardService.updateBoardCells(this.fen);
      }
    } else {
      this.selectedFromPieceCell = cellClicked;
      this.updatePointedBoardCells(moves);
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
        this.displayedMoves.push({
          ...move,
          capturedPiece: this.boardService.getBoardCellPieceSymbol(move.to),
        });
        this.boardService.updateBoardCells(this.fen);
        this.updatePlayerTurnState.next();
      });
    this.isNextMoveAPromotion = false;
    this.promotionCellName = '';
    this.resetSelectedPiece();
    this.resetPointedCells();
  }

  onPieceDrag(event: CdkDragStart<any>) {
    if (!this.stateValid) return;
    console.log('drag');
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
    console.log('drop');
    const { x, y } = event.dropPoint;

    console.log({ x, y });

    const boardLetterPosition = Math.min(Math.max(Math.floor(x / 60), 0), 7); //TODO: height and with resizable in variable with multiple of 60 (ie 480)
    const boardNumberPosition = 8 - (Math.floor(y / 60) - 4);

    const boardCell = this.boardService.fromCoordinatesToBoardCellNotation([
      boardLetterPosition,
      boardNumberPosition,
    ]);

    console.log(boardCell); //TODO: fix board drop predicate :

    //     import {Component} from '@angular/core';
    // import {
    //   CdkDragDrop,
    //   moveItemInArray,
    //   transferArrayItem,
    //   CdkDrag,
    //   CdkDropList,
    // } from '@angular/cdk/drag-drop';

    // /**
    //  * @title Drag&Drop enter predicate
    //  */
    // @Component({
    //   selector: 'cdk-drag-drop-enter-predicate-example',
    //   templateUrl: 'cdk-drag-drop-enter-predicate-example.html',
    //   styleUrl: 'cdk-drag-drop-enter-predicate-example.css',
    //   imports: [CdkDropList, CdkDrag],
    // })
    // export class CdkDragDropEnterPredicateExample {
    //   all = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    //   even = [10];

    //   drop(event: CdkDragDrop<number[]>) {
    //     if (event.previousContainer === event.container) {
    //       moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    //     } else {
    //       transferArrayItem(
    //         event.previousContainer.data,
    //         event.container.data,
    //         event.previousIndex,
    //         event.currentIndex,
    //       );
    //     }
    //   }

    //   /** Predicate function that only allows even numbers to be dropped into a list. */
    //   evenPredicate(item: CdkDrag<number>) {
    //     return item.data % 2 === 0;
    //   }

    //   /** Predicate function that doesn't allow items to be dropped into a list. */
    //   noReturnPredicate() {
    //     return false;
    //   }
    // }

    // <div class="example-container">
    //   <h2>Available numbers</h2>

    //   <div
    //     id="all"
    //     cdkDropList
    //     [cdkDropListData]="all"
    //     cdkDropListConnectedTo="even"
    //     class="example-list"
    //     (cdkDropListDropped)="drop($event)"
    //     [cdkDropListEnterPredicate]="noReturnPredicate">
    //     @for (number of all; track number) {
    //       <div
    //           class="example-box"
    //           [cdkDragData]="number"
    //           cdkDrag>{{number}}</div>
    //     }
    //   </div>
    // </div>

    // <div class="example-container">
    //   <h2>Even numbers</h2>

    //   <div
    //     id="even"
    //     cdkDropList
    //     [cdkDropListData]="even"
    //     cdkDropListConnectedTo="all"
    //     class="example-list"
    //     (cdkDropListDropped)="drop($event)"
    //     [cdkDropListEnterPredicate]="evenPredicate">
    //     @for (number of even; track number) {
    //       <div
    //           class="example-box"
    //           cdkDrag
    //           [cdkDragData]="number">{{number}}</div>
    //     }
    //   </div>
    // </div>

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
  @HostListener('document:wheel', ['$event'])
  handleMouseWheel(event: WheelEvent) {
    if (event.deltaY > 0) {
      //scroll on bottom
      const lastMove = this.displayedMoves.pop();
      if (lastMove) {
        const fromPiece = this.boardService.getBoardCellPieceSymbol(
          lastMove.to
        );
        const toPiece = lastMove.capturedPiece;

        this.boardService.setBoardCellPieceSymbol(lastMove.from, fromPiece);
        this.boardService.setBoardCellPieceSymbol(lastMove.to, toPiece);
      }
      this.stateValid = false;
    } else {
      if (this.displayedMoves.length < this.moveMadeList.length) {
        const redoMove = this.moveMadeList[this.displayedMoves.length];
        const piece = this.boardService.getBoardCellPieceSymbol(redoMove.from);

        this.displayedMoves.push({
          ...redoMove,
          capturedPiece: this.boardService.getBoardCellPieceSymbol(redoMove.to),
        });
        this.boardService.setBoardCellPieceSymbol(redoMove.to, piece);
        this.boardService.setBoardCellPieceSymbol(redoMove.from, null);
      } else {
        this.stateValid = true;
      }
    }
  }
}
