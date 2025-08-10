import {
  CdkDrag,
  CdkDragEnd,
  CdkDragPlaceholder,
  CdkDragStart,
  CdkDropList,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import { JsonPipe, NgStyle } from '@angular/common';
import { Component, HostListener, Input, OnInit, Output } from '@angular/core';
import { forkJoin, mergeMap, Subject } from 'rxjs';
import { MoveBoardComponent } from 'src/app/move-board/move-board.component';
import { ChessboardArrowService } from '../chess-board-arrow/board-arrow.service';
import {
  BoardInformation,
  BoardMove,
  chessApiService,
  Move,
} from '../services/chess.api.service';
import {
  boardCellNotation,
  boardCells,
  PieceSymbol,
} from '../services/chessTypes';

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
export class StockfishBoardComponent implements OnInit {
  @Input()
  public fen!: string;

  @Output()
  public moveMadeList: Array<Move> = new Array();

  private displayedMoves: Array<BoardMove> = new Array();

  private pointedCells: string[] = [];

  private stateValid: boolean = true;
  private isNextMoveAPromotion = false;

  private boardCells: boardCells = {} as boardCells;

  updatePlayerTurnState = new Subject<void>();
  selectedFromPieceCell: boardCellNotation | null = null;
  promotionCellName: boardCellNotation | null = null;
  moveList: Move[] = [];

  boardInformation: BoardInformation | null = null;

  constructor(
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
    const boardPartFen = this.fen.split(' ')[0];
    let boardCells: boardCells = {} as boardCells;
    let column = 0;
    let row = 0;
    for (let fenRow of boardPartFen.split('/')) {
      column = 0;
      for (let fenRowItem of fenRow) {
        if (!isNaN(parseFloat(fenRowItem))) {
          for (let index = 0; index < +fenRowItem; index++) {
            const cellName = `${this.fromCoordinatesToBoardCellNotation([
              column + index,
              8 - row,
            ])}` as boardCellNotation;
            boardCells[cellName] = { pieceSymbol: null, pointed: false };
          }
          column += +fenRowItem;
          continue;
        }
        const cellName = `${this.fromCoordinatesToBoardCellNotation([
          column,
          8 - row,
        ])}` as boardCellNotation;
        boardCells[cellName] = {
          pieceSymbol: fenRowItem as PieceSymbol,
          pointed: false,
        };
        column++;
      }
      row++;
    }
    this.boardCells = boardCells;
    this.chessService.updateFen(this.fen).subscribe(() => {
      this.arrowService.initializeCanvas();
      this.updatePlayerTurnState.next();
    });
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

  isCellEnPassant(cell: boardCellNotation): boolean {
    return this.moveList.some((move) => move.to === cell && move.isEnPassant);
  }

  public getBoardCellPieceSymbol(cell: boardCellNotation): PieceSymbol | null {
    return this.boardCells[cell].pieceSymbol;
  }

  public setBoardCellPieceSymbol(
    cell: boardCellNotation,
    value: PieceSymbol | null
  ): void {
    this.boardCells[cell].pieceSymbol = value;
  }

  public getBoardCellsValues(): {
    pieceSymbol: PieceSymbol | null;
    pointed: boolean;
  }[] {
    return Object.values(this.boardCells);
  }

  public getBoardCellsKeys(): boardCellNotation[] {
    return Object.keys(this.boardCells) as boardCellNotation[];
  }

  public getBoardEntries(): [
    string,
    { pieceSymbol: PieceSymbol | null; pointed: boolean }
  ][] {
    return Object.entries(this.boardCells);
  }

  public setPointedCellListState(
    pointedCellList: string[],
    state: boolean
  ): void {
    pointedCellList.forEach((oldPointedCellName: string) => {
      this.boardCells[oldPointedCellName as boardCellNotation].pointed = state;
    });
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
    return this.getUrlFromPieceSymbol(pieceSymbol);
  }

  get chessBoardCellsContents() {
    return this.getBoardCellsValues();
  }

  get chessBoardCellsKeys(): boardCellNotation[] {
    return this.getBoardCellsKeys();
  }

  get chessBoardCells() {
    return this.getBoardEntries();
  }

  get chessBoardPromotionSquare() {
    return this.promotionCellName;
  }

  private resetPointedCells(): void {
    this.setPointedCellListState(this.pointedCells, false);
    this.pointedCells = [];
  }

  private resetSelectedPiece(): void {
    this.selectedFromPieceCell = null;
  }

  private applyMoveOnBoard(move: Move, selectedPieceCell: boardCellNotation) {
    this.setBoardCellPieceSymbol(
      move.to,
      this.getBoardCellPieceSymbol(selectedPieceCell)
    );
    this.setBoardCellPieceSymbol(move.from, null);
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
      this.fromBoardCellLetterNotationToCoordinates(
        this.promotionCellName as boardCellNotation
      );
    return this.fromCoordinatesToBoardCellNotation([
      promotionCellCoordinates[0],
      this.playerTurn === 'w'
        ? promotionCellCoordinates[1] - index
        : promotionCellCoordinates[1] + index,
    ]);
  }

  private updatePointedBoardCells(moves: Move[]): void {
    this.resetPointedCells();
    this.pointedCells = this.getBoardEntries()
      .filter((boardCell) => !!moves.find((move) => boardCell[0] === move.to))
      .map((boardCell) => boardCell[0]);
    this.setPointedCellListState(this.pointedCells, true);
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

  onEmptyCellClick(cellClicked: boardCellNotation): void {
    console.log('blblbll');
    if (!this.stateValid) return;
    const selectedPieceCell = this.selectedFromPieceCell;
    if (selectedPieceCell) {
      const move = this.getNextPotentialMoveFromCoordinateCells(
        selectedPieceCell,
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
              capturedPiece: this.getBoardCellPieceSymbol(move.to),
            });
            this.applyMoveOnBoard(move, selectedPieceCell);
            this.updatePlayerTurnState.next();
          });
      }
      this.resetPointedCells();
      this.resetSelectedPiece();
    }
  }

  onCellClick(cellClicked: boardCellNotation): void {
    if (!this.stateValid) return;
    const moves = this.getChessBoardMoveListFromCell(cellClicked);
    if (!this.selectedFromPieceCell) {
      this.selectedFromPieceCell = cellClicked;
      this.updatePointedBoardCells(moves);
      return;
    }

    if (this.selectedFromPieceCell) {
      const selectedPieceCell = this.selectedFromPieceCell;
      const move = this.getNextPotentialMoveFromCoordinateCells(
        selectedPieceCell,
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
              capturedPiece: this.getBoardCellPieceSymbol(move.to),
            });
            this.applyMoveOnBoard(move, selectedPieceCell);
            this.updatePlayerTurnState.next();
          });
        this.resetPointedCells();
        this.resetSelectedPiece();
        return;
      }
    }
    this.selectedFromPieceCell = cellClicked;
    this.updatePointedBoardCells(moves);
  }

  onPromotionPieceClick(promotionPiece: PieceSymbol): void {
    const selectedPieceCell = this.selectedFromPieceCell;
    const promotionPieceCell = this.promotionCellName;
    if (!this.stateValid || !selectedPieceCell || !promotionPieceCell) return;
    const move = this.getNextPotentialMoveFromCoordinateCells(
      selectedPieceCell,
      promotionPieceCell
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
          capturedPiece: this.getBoardCellPieceSymbol(move.to),
        });
        this.setBoardCellPieceSymbol(move.to, promotionPiece);
        this.setBoardCellPieceSymbol(move.from, null);
        this.updatePlayerTurnState.next();
      });
    this.isNextMoveAPromotion = false;
    this.promotionCellName = null;
    this.resetSelectedPiece();
    this.resetPointedCells();
  }

  onPieceDrag(event: CdkDragStart<any>) {
    if (!this.stateValid) return;
    console.log('drag');
    const cellClicked = event.source.element.nativeElement
      .id as boardCellNotation;
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

    const boardCell = this.fromCoordinatesToBoardCellNotation([
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

  emptyOrOtherSideOccupiedCellPredicate(dragEvent: CdkDrag<boardCellNotation>) {
    const pieceOnboardCell = this.getBoardCellPieceSymbol(dragEvent.data);
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
        const fromPiece = this.getBoardCellPieceSymbol(lastMove.to);
        const toPiece = lastMove.capturedPiece;

        this.setBoardCellPieceSymbol(lastMove.from, fromPiece);
        this.setBoardCellPieceSymbol(lastMove.to, toPiece);
      }
      this.stateValid = false;
    } else {
      if (this.displayedMoves.length < this.moveMadeList.length) {
        const redoMove = this.moveMadeList[this.displayedMoves.length];
        const piece = this.getBoardCellPieceSymbol(redoMove.from);

        this.displayedMoves.push({
          ...redoMove,
          capturedPiece: this.getBoardCellPieceSymbol(redoMove.to),
        });
        this.setBoardCellPieceSymbol(redoMove.to, piece);
        this.setBoardCellPieceSymbol(redoMove.from, null);
      } else {
        this.stateValid = true;
      }
    }
  }

  public fromCoordinatesToBoardCellNotation(
    coordinates: [number, number]
  ): boardCellNotation {
    return String.fromCharCode(97 + coordinates[0]).concat(
      '' + coordinates[1]
    ) as boardCellNotation;
  }

  public fromBoardCellLetterNotationToCoordinates(
    cellNotation: boardCellNotation
  ): [number, number] {
    return [cellNotation[0].charCodeAt(0) - 97, +cellNotation[1]];
  }

  getUrlFromPieceSymbol(pieceSymbol: PieceSymbol): string | undefined {
    /**
     * Get piece picture url using piece type and player color.
     * @param piece: The piece used to get the url from.
     * @returns url string for piece given.
     */
    const baseUrl = 'https://upload.wikimedia.org/wikipedia/commons';
    let pieceUrl;
    switch (pieceSymbol) {
      case 'p':
      case 'P':
        pieceUrl =
          pieceSymbol.toUpperCase() === pieceSymbol
            ? '/4/45/Chess_plt45.svg'
            : '/c/c7/Chess_pdt45.svg';
        return `${baseUrl}${pieceUrl}`;
      case 'n':
      case 'N':
        pieceUrl =
          pieceSymbol.toUpperCase() === pieceSymbol
            ? '/7/70/Chess_nlt45.svg'
            : '/e/ef/Chess_ndt45.svg';
        return `${baseUrl}${pieceUrl}`;
      case 'b':
      case 'B':
        pieceUrl =
          pieceSymbol.toUpperCase() === pieceSymbol
            ? '/b/b1/Chess_blt45.svg'
            : '/9/98/Chess_bdt45.svg';
        return `${baseUrl}${pieceUrl}`;
      case 'r':
      case 'R':
        pieceUrl =
          pieceSymbol.toUpperCase() === pieceSymbol
            ? '/7/72/Chess_rlt45.svg'
            : '/f/ff/Chess_rdt45.svg';
        return `${baseUrl}${pieceUrl}`;
      case 'q':
      case 'Q':
        pieceUrl =
          pieceSymbol.toUpperCase() === pieceSymbol
            ? '/1/15/Chess_qlt45.svg'
            : '/4/47/Chess_qdt45.svg';
        return `${baseUrl}${pieceUrl}`;
      case 'k':
      case 'K':
        pieceUrl =
          pieceSymbol.toUpperCase() === pieceSymbol
            ? '/4/42/Chess_klt45.svg'
            : '/f/f0/Chess_kdt45.svg';
        return `${baseUrl}${pieceUrl}`;
    }
  }
}
