import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  HostListener,
  Output,
  OnDestroy,
} from '@angular/core';
import { CdkDragEnd, CdkDragStart } from '@angular/cdk/drag-drop';
import { PieceSymbol, boardCellNotation } from '../services/chessTypes';
import { BoardService } from '../services/board.service';
import { ChessboardArrowService } from '../chess-board-arrow/board-arrow.service';
import {
  BoardInformation,
  chessApiService,
  Move,
} from '../services/chess.api.service';
import {
  BehaviorSubject,
  forkJoin,
  mergeMap,
  of,
  Subject,
  Subscription,
  switchMap,
} from 'rxjs';

@Component({
  selector: 'app-stockfish-board',
  templateUrl: './stockfish-board.component.html',
  styleUrls: ['./stockfish-board.component.scss'],
})
export class StockfishBoardComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public fen!: string;

  @Output()
  public moveMadeList: Array<Move> = new Array();

  private displayedMoves: Array<Move> = new Array();

  private stateValid: boolean = true;

  private pointedCells: string[] = [];
  private selectedFromPieceCell: string = '';
  private lastMove: Move | null = null;

  private lastMoveIndex: number = -1;

  private isLastMovePromotion = false;
  private promotionCellName: string = '';

  private isMovesFromCellArePromotion: BehaviorSubject<boolean> =
    new BehaviorSubject(false);

  private promotionPiecesSet: BehaviorSubject<Set<PieceSymbol>> =
    new BehaviorSubject(new Set());

  subscriptionList: Subscription = new Subscription();

  onStockFishBoardStateUpdate = new Subject<void>();
  onMoveEndCellClicked = new Subject<string>();
  moveList: Move[] = [];

  private boardInformation: BoardInformation | null = null;

  constructor(
    private boardService: BoardService,
    private chessService: chessApiService,
    private arrowService: ChessboardArrowService
  ) {
    this.onStockFishBoardStateUpdate
      .pipe(
        mergeMap(() =>
          forkJoin({
            stockFishMoveList: this.chessService.fetchBestStockFishMoveList(),
            boardInformation: this.chessService.fetchBoardInformation(),
          })
        )
      )
      .subscribe(({ stockFishMoveList, boardInformation }) => {
        this.moveList = stockFishMoveList;
        this.boardInformation = boardInformation;
      });
    this.onMoveEndCellClicked
      .pipe(
        switchMap((cellClicked) => {
          if (this.isEndOfChessBoardMoveValid(cellClicked)) {
            this.chessService.applyChessMove(
              this.selectedFromPieceCell,
              cellClicked
            );
            return of(cellClicked);
          }
          return of(null);
        })
      )
      .subscribe((cellClicked) => {
        if (cellClicked !== null) {
          const move = this.getMoveFromCoordinateCells(
            this.selectedFromPieceCell,
            cellClicked
          );
          if (move) {
            this.moveMadeList.push(move);
            this.displayedMoves.push(move);
            this.updateChessBoard();
            this.updateChessBoardLastMove(move);
            this.onStockFishBoardStateUpdate.next();
          }
          this.resetSelectedPiece();
          this.resetPointedCells();
        }
      });
  }

  ngOnInit(): void {
    this.buildChessBoard();
    this.arrowService.initializeCanvas();
    this.onStockFishBoardStateUpdate.next();
    this.chessService.updateStockFishFen(this.fen).subscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const fenChanged = changes['fen'];
    if (fenChanged) {
      this.buildChessBoard();
    }
  }

  ngOnDestroy(): void {
    this.subscriptionList.unsubscribe();
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

  getMoveFromCoordinateCells(from: string, to: string): Move | undefined {
    return this.moveList.find(
      (chessMove) => chessMove.from === from && chessMove.to === to
    );
  }

  get playerTurn(): 'w' | 'b' {
    const fenPlayerTurnPart = this.fen.split(' ')[2];
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

  private updateChessBoard(): void {
    this.chessService.fetchStockFishFen().subscribe((newFen) => {
      this.fen = newFen;
      this.buildChessBoard();
    });
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
    return this.promotionPiecesSet.getValue();
  }

  get openPromotionChoices() {
    return this.isLastMovePromotion;
  }

  private potentialMoveEndsInPromotion(): boolean {
    return this.isMovesFromCellArePromotion.getValue();
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
    console.group('updatePointedBoardCells');
    this.boardService.changeCellPointedState(this.pointedCells, false);
    this.pointedCells = this.boardService
      .getBoardEntries()
      .filter((boardCell) => !!moves.find((move) => boardCell[0] === move.to))
      .map((boardCell) => boardCell[0]);
    console.table(this.pointedCells);
    this.boardService.changeCellPointedState(this.pointedCells, true);
    console.groupEnd();
  }

  isKingCellChecked(cellName: {
    pieceSymbol: PieceSymbol | 'no piece';
    pointed: boolean;
  }): boolean {
    const whiteKingIsCheckInTurn =
      cellName.pieceSymbol === 'K' &&
      this.boardInformation !== null &&
      this.boardInformation.is_check &&
      this.boardInformation.turn;
    const blackKingIsCheckInTurn =
      cellName.pieceSymbol === 'k' &&
      this.boardInformation !== null &&
      this.boardInformation.is_check &&
      !this.boardInformation.turn;
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

  onEmptyCellClick(cellClick: string) {
    console.group('onEmptyCellClick');
    console.log(this.selectedFromPieceCell);
    console.log(cellClick);
    if (!this.stateValid) return;
    if (this.selectedFromPieceCell && this.potentialMoveEndsInPromotion()) {
      this.isLastMovePromotion = true;
      this.promotionCellName = cellClick;
      return;
    }
    if (this.selectedFromPieceCell) {
      this.chessService
        .applyChessMove(this.selectedFromPieceCell, cellClick)
        .subscribe(() => {
          const move = this.getMoveFromCoordinateCells(
            this.selectedFromPieceCell,
            cellClick
          );
          if (move) {
            this.moveMadeList.push(move);
            this.displayedMoves.push(move);
            this.updateChessBoardLastMove(move);
            this.onStockFishBoardStateUpdate.next();
          }
        });
    }
    this.resetPointedCells();
    this.resetSelectedPiece();
    this.updateChessBoard();
    console.groupEnd();
  }

  onCellClick(cellClicked: string): void {
    console.group('onCellClick');
    if (!this.stateValid) return;
    const moves = this.getChessBoardMoveListFromCell(cellClicked);
    console.log(moves);

    if (this.selectedFromPieceCell && this.potentialMoveEndsInPromotion()) {
      this.isLastMovePromotion = true;
      this.promotionCellName = cellClicked;
      console.log('return ?');
      return;
    }
    if (this.selectedFromPieceCell) {
      this.onMoveEndCellClicked.next(cellClicked);
    }
    if (moves.length && !this.selectedFromPieceCell) {
      this.selectedFromPieceCell = cellClicked;
    }
    this.updatePointedBoardCells(moves);
    console.groupEnd();
  }

  onPromotionPieceClick(promotionPiece: PieceSymbol): void {
    if (!this.stateValid) return;
    this.onMoveEndCellClicked.next(this.promotionCellName);
    this.isLastMovePromotion = false;
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
