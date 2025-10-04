import { NgStyle } from '@angular/common';
import {
  Component,
  computed,
  effect,
  HostListener,
  input,
  OnInit,
  signal,
  inject,
  output,
} from '@angular/core';
import { forkJoin, mergeMap, of, Subject } from 'rxjs';
import { MoveBoardComponent } from 'src/app/move-board/move-board.component';
import { ChessboardArrowService } from '../chess-board-arrow/board-arrow.service';
import {
  BoardInformation,
  BoardMove,
  chessApiService,
  Move,
  StockFishSettings,
} from '../services/chess.api.service';
import {
  boardCellNotation,
  boardCells,
  PieceSymbol,
} from '../services/chessTypes';
import { entries } from 'src/main';
import { ChessGameSettings } from 'src/app/game.store';

@Component({
  selector: 'app-stockfish-board',
  templateUrl: './stockfish-board.component.html',
  styleUrls: ['./stockfish-board.component.scss'],
  imports: [NgStyle, MoveBoardComponent],
})
export class StockfishBoardComponent implements OnInit {
  private chessService = inject(chessApiService);
  private arrowService = inject(ChessboardArrowService);

  public settings = input.required<ChessGameSettings>();

  public moveMadeList = signal<Move[]>([]);

  fen = signal('');

  private displayedMoveList = signal<BoardMove[]>([]);
  private pointedCells = signal<boardCellNotation[]>([]);
  private stateValid = signal(true);
  isNextMoveAPromotion = signal(false);

  private boardCells = signal<boardCells>({} as boardCells);

  selectedFromPieceCell = signal<boardCellNotation | null>(null);
  selectedPieceDropCell = signal<boardCellNotation | null>(null);
  promotionCellName = signal<boardCellNotation | null>(null);
  moveList = signal<Move[]>([]);

  boardInformation = signal<BoardInformation | null>(null);

  gameFinished = output<void>();

  boardCellEntries = computed(() =>
    this.playerColor() === 'w'
      ? entries(this.boardCells())
      : entries(this.boardCells()).reverse(),
  );

  playerColor = computed(() => this.settings().playerSymbol);

  playerTurn = computed(() => {
    const fenPlayerTurnPart = this.fen().split(' ')[1];
    if (fenPlayerTurnPart !== 'w' && fenPlayerTurnPart !== 'b') {
      throw new Error('Fen is not valid.');
    }
    return fenPlayerTurnPart;
  });

  isPlayerTurn = computed(() => this.playerColor() === this.playerTurn());

  lastMove = computed(
    () => this.displayedMoveList()[this.displayedMoveList().length - 1] ?? null,
  );

  boardLastMoveFrom = computed(() =>
    this.lastMove() !== null ? this.lastMove().from : '',
  );

  boardLastMoveTo = computed(() =>
    this.lastMove() !== null ? this.lastMove().to : '',
  );

  potentialsPromotionsPieces = computed(() => {
    return new Set(
      this.moveList()
        .filter(
          (move) =>
            move.from === this.selectedFromPieceCell() &&
            move.to === this.promotionCellName(),
        )
        .map((promotionMove) => promotionMove.promotion)
        .filter((promotionPieceSymbol) => !!promotionPieceSymbol),
    );
  });

  updatePlayerTurnState = new Subject<void>();
  constructor() {
    this.addPlayerTurnListener();
    this.addStockFishTurnListener();
    this.addFenUpdateListener();
  }

  ngOnInit(): void {
    const initialFen = this.settings().fen;
    const stockfishSettings: StockFishSettings = {
      skillLevel: this.settings().skillLevel,
      threads: 1,
      hash: 16,
    };
    this.chessService
      .resetBoardState()
      .pipe(
        mergeMap(() =>
          this.chessService.updateStockfishSettings(stockfishSettings),
        ),
        mergeMap(() => this.chessService.updateFen(initialFen)),
      )
      .subscribe(() => {
        this.arrowService.initializeCanvas();
        this.fen.set(initialFen);
      });
  }

  private addFenUpdateListener(): void {
    effect(() => {
      const boardPartFen = this.fen().split(' ')[0];
      const boardCells: boardCells = {} as boardCells;
      let column = 0;
      let row = 0;
      for (const fenRow of boardPartFen.split('/')) {
        column = 0;
        for (const fenRowItem of fenRow) {
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
      this.boardCells.set(boardCells);
    });
  }

  private addStockFishTurnListener(): void {
    effect(() => {
      if (this.playerTurn() === this.playerColor()) {
        this.updatePlayerTurnState.next();
      } else {
        this.playStockFishTurn();
      }
    });
  }

  private resetPointedCells(): void {
    this.setPointedCellListState(this.pointedCells(), false);
    this.pointedCells.set([]);
  }

  private resetSelectedPiece(): void {
    this.selectedFromPieceCell.set(null);
  }

  private playStockFishTurn(): void {
    this.chessService
      .applyStockfishMove()
      .pipe(
        mergeMap((move) =>
          forkJoin({ move: of(move), newFen: this.chessService.fetchFen() }),
        ),
      )
      .subscribe(({ move, newFen }) => {
        this.fen.set(newFen);
        this.moveMadeList.update((moveMadeList) => [...moveMadeList, move]);
        this.displayedMoveList.update((displayedMoveList) => [
          ...displayedMoveList,
          {
            ...move,
            capturedPiece: this.getBoardCellPieceSymbol(move.to),
          },
        ]);
        this.updatePlayerTurnState.next();
      });
  }

  private addPlayerTurnListener(): void {
    this.updatePlayerTurnState
      .pipe(
        mergeMap(() =>
          forkJoin({
            moveList: this.chessService.fetchMoveList(),
            boardInformation: this.chessService.fetchBoardInformation(),
          }),
        ),
      )
      .subscribe(({ moveList, boardInformation }) => {
        this.moveList.set(moveList);
        this.boardInformation.set(boardInformation);
        if (boardInformation.game_over) {
          this.gameFinished.emit();
        }
      });
  }

  getChessBoardMoveListFromCell(cell: string): Move[] {
    return this.moveList().filter((chessMove) => chessMove.from === cell);
  }

  isEndOfChessBoardMoveValid(toCell: string): boolean {
    return !!this.moveList().find(
      (chessMove) =>
        chessMove.from === this.selectedFromPieceCell() &&
        chessMove.to === toCell,
    );
  }

  isCellEnPassant(cell: boardCellNotation): boolean {
    return this.moveList().some((move) => move.to === cell && move.isEnPassant);
  }

  public getBoardCellPieceSymbol(cell: boardCellNotation): PieceSymbol | null {
    return this.boardCells()[cell].pieceSymbol;
  }

  public setBoardCellPieceSymbol(
    cell: boardCellNotation,
    value: PieceSymbol | null,
  ): void {
    this.boardCells.update((boardCells) => ({
      ...boardCells,
      [cell]: { ...boardCells[cell], pieceSymbol: value },
    }));
  }

  public setPointedCellListState(
    pointedCellList: boardCellNotation[],
    state: boolean,
  ): void {
    pointedCellList.forEach((oldPointedCellName) => {
      this.boardCells.update((boardCells) => ({
        ...boardCells,
        [oldPointedCellName]: {
          ...boardCells[oldPointedCellName],
          pointed: state,
        },
      }));
    });
  }

  private isMoveAPromotion(move: Move): boolean {
    return move.promotion !== null;
  }

  getNextPotentialMoveFromCoordinateCells(
    from: string,
    to: string,
  ): Move | undefined {
    return this.moveList().find(
      (chessMove) => chessMove.from === from && chessMove.to === to,
    );
  }

  piecePictureUrl(pieceSymbol: PieceSymbol) {
    return this.getUrlFromPieceSymbol(pieceSymbol);
  }

  promotionSquarePositionFromIndex(index: number): boardCellNotation {
    const promotionCellCoordinates =
      this.fromBoardCellLetterNotationToCoordinates(
        this.promotionCellName() as boardCellNotation,
      );
    return this.fromCoordinatesToBoardCellNotation([
      promotionCellCoordinates[0],
      this.playerTurn() === 'w'
        ? promotionCellCoordinates[1] - index
        : promotionCellCoordinates[1] + index,
    ]);
  }

  private updatePointedBoardCells(moves: Move[]): void {
    this.resetPointedCells();
    this.pointedCells.set(
      this.boardCellEntries()
        .filter((boardCell) => !!moves.find((move) => boardCell[0] === move.to))
        .map((boardCell) => boardCell[0]) as boardCellNotation[],
    );
    this.setPointedCellListState(this.pointedCells(), true);
  }

  isKingCellChecked(cellName: {
    pieceSymbol: PieceSymbol | null;
    pointed: boolean;
  }): boolean {
    const boardInformation = this.boardInformation();
    const whiteKingIsCheckInTurn =
      cellName.pieceSymbol === 'K' &&
      boardInformation !== null &&
      boardInformation.is_check &&
      boardInformation.turn === 'w';
    const blackKingIsCheckInTurn =
      cellName.pieceSymbol === 'k' &&
      boardInformation !== null &&
      boardInformation.is_check &&
      boardInformation.turn === 'b';
    return whiteKingIsCheckInTurn || blackKingIsCheckInTurn;
  }

  isCellOccupied(cellName: string): boolean {
    return (
      this.boardCellEntries().find(
        (chessBoardCell) =>
          chessBoardCell[0] === cellName &&
          chessBoardCell[1].pieceSymbol !== null,
      ) !== undefined
    );
  }

  isCellMoveDestinationFromSelectedPieceMove(
    cellName: boardCellNotation,
  ): boolean {
    return this.moveList().some(
      (move) =>
        move.from === this.selectedFromPieceCell() && move.to === cellName,
    );
  }

  onEmptyCellClick(cellClicked: boardCellNotation): void {
    if (!this.stateValid()) return;
    const selectedPieceCell = this.selectedFromPieceCell();
    if (selectedPieceCell) {
      const move = this.getNextPotentialMoveFromCoordinateCells(
        selectedPieceCell,
        cellClicked,
      );
      if (move) {
        if (this.isMoveAPromotion(move)) {
          this.isNextMoveAPromotion.set(true);
          this.promotionCellName.set(cellClicked);
          return;
        }

        this.chessService
          .applyChessMove(move)
          .pipe(mergeMap(() => this.chessService.fetchFen()))
          .subscribe((newFen) => {
            this.fen.set(newFen);
            this.moveMadeList.update((moveMadeList) => [...moveMadeList, move]);
            this.displayedMoveList.update((displayedMoveList) => [
              ...displayedMoveList,
              {
                ...move,
                capturedPiece: this.getBoardCellPieceSymbol(move.to),
              },
            ]);
            this.updatePlayerTurnState.next();
          });
      }
      this.resetPointedCells();
      this.resetSelectedPiece();
    }
  }

  onCellClick(cellClicked: boardCellNotation): void {
    console.log(this.playerTurn());
    console.log(this.moveList());
    console.log(cellClicked);
    if (!this.stateValid()) return;
    const moves = this.getChessBoardMoveListFromCell(cellClicked);
    if (!this.selectedFromPieceCell()) {
      this.selectedFromPieceCell.set(cellClicked);
      this.updatePointedBoardCells(moves);
      return;
    }

    const selectedPieceCell = this.selectedFromPieceCell();
    if (selectedPieceCell) {
      const move = this.getNextPotentialMoveFromCoordinateCells(
        selectedPieceCell,
        cellClicked,
      );
      if (move) {
        if (this.isMoveAPromotion(move)) {
          this.isNextMoveAPromotion.set(true);
          this.promotionCellName.set(cellClicked);
          return;
        }
        this.chessService
          .applyChessMove(move)
          .pipe(mergeMap(() => this.chessService.fetchFen()))
          .subscribe((newFen) => {
            this.fen.set(newFen);
            this.moveMadeList.update((moveMadeList) => [...moveMadeList, move]);
            this.displayedMoveList.update((displayedMoveList) => [
              ...displayedMoveList,
              {
                ...move,
                capturedPiece: this.getBoardCellPieceSymbol(move.to),
              },
            ]);
            this.updatePlayerTurnState.next();
          });
        this.resetPointedCells();
        this.resetSelectedPiece();
        return;
      }
    }
    this.selectedFromPieceCell.set(cellClicked);
    this.updatePointedBoardCells(moves);
  }

  onPromotionPieceClick(promotionPiece: PieceSymbol): void {
    const selectedPieceCell = this.selectedFromPieceCell();
    const promotionPieceCell = this.promotionCellName();
    if (!this.stateValid() || !selectedPieceCell || !promotionPieceCell) return;
    const move = this.getNextPotentialMoveFromCoordinateCells(
      selectedPieceCell,
      promotionPieceCell,
    );
    if (!move) {
      return;
    }
    move.promotion = promotionPiece;
    this.chessService
      .applyChessMove(move)
      .pipe(mergeMap(() => this.chessService.fetchFen()))
      .subscribe((newFen) => {
        this.fen.set(newFen);
        this.moveMadeList.update((moveMadeList) => [...moveMadeList, move]);
        this.displayedMoveList.update((displayedMoveList) => [
          ...displayedMoveList,
          {
            ...move,
            capturedPiece: this.getBoardCellPieceSymbol(move.to),
          },
        ]);
        this.updatePlayerTurnState.next();
      });
    this.isNextMoveAPromotion.set(false);
    this.promotionCellName.set(null);
    this.resetSelectedPiece();
    this.resetPointedCells();
  }

  onPieceDrag(event: DragEvent): void {
    if (!this.stateValid()) return;
    const cellClicked = (event.target as HTMLDivElement)
      .id as boardCellNotation;
    const moves = this.getChessBoardMoveListFromCell(cellClicked);
    if (moves.length) {
      this.resetPointedCells();
      this.selectedFromPieceCell.set(cellClicked);
    }
    this.updatePointedBoardCells(moves);
  }

  onPieceDrop(): void {
    if (!this.stateValid()) return;

    const boardCell = this.selectedPieceDropCell();

    if (boardCell) {
      if (this.isCellOccupied(boardCell)) {
        this.onCellClick(boardCell);
        return;
      }
      this.onEmptyCellClick(boardCell);
    }
    this.selectedPieceDropCell.set(null);
  }

  onEmptyCellDragEnter(event: DragEvent): void {
    const cellClicked = event.target as HTMLDivElement;
    const cellId = cellClicked.id as boardCellNotation;
    if (this.isCellMoveDestinationFromSelectedPieceMove(cellId)) {
      cellClicked.style.backgroundColor = 'rgb(0, 255, 0)';
      this.selectedPieceDropCell.set(cellId);
    }
  }

  onEmptyCellDragLeave(event: DragEvent): void {
    const cellClicked = event.target as HTMLDivElement;
    const cellId = cellClicked.id as boardCellNotation;

    if (this.isCellMoveDestinationFromSelectedPieceMove(cellId)) {
      cellClicked.style.backgroundColor = 'unset';
    }
  }

  onCellDragEnter(event: DragEvent): void {
    const cellClicked = event.target as HTMLDivElement;
    const cellId = cellClicked.id as boardCellNotation;
    if (this.isCellMoveDestinationFromSelectedPieceMove(cellId)) {
      cellClicked.style.backgroundColor = 'rgba(255, 77, 0, 1)';
      this.selectedPieceDropCell.set(cellId);
    }
  }

  onCellDragLeave(event: DragEvent): void {
    const cellClicked = event.target as HTMLDivElement;
    const cellId = cellClicked.id as boardCellNotation;

    if (this.isCellMoveDestinationFromSelectedPieceMove(cellId)) {
      cellClicked.style.backgroundColor = 'unset';
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    this.arrowService.manageKeyPressed(event);
  }

  @HostListener('document:mousedown', ['$event'])
  handleMouseDown(event: MouseEvent): void {
    this.arrowService.drawBoardLightCircle(event);
  }

  @HostListener('document:mouseup', ['$event'])
  handleMouseUp(event: MouseEvent): void {
    this.arrowService.drawBoardFullCircle(event);
  }

  @HostListener('document:mousemove', ['$event'])
  handleMouseMove(event: MouseEvent): void {
    this.arrowService.drawingArrow(event);
  }

  @HostListener('document:contextmenu', ['$event'])
  handleContextMenu(event: Event): void {
    event.preventDefault();
  }
  @HostListener('document:wheel', ['$event'])
  handleMouseWheel(event: WheelEvent): void {
    if (event.deltaY > 0) {
      //scroll on bottom
      const lastMove = this.displayedMoveList().pop();
      if (lastMove) {
        this.displayedMoveList.update((displayedMoveList) =>
          displayedMoveList.splice(-1),
        );
        const fromPiece = this.getBoardCellPieceSymbol(lastMove.to);
        const toPiece = lastMove.capturedPiece;

        this.setBoardCellPieceSymbol(lastMove.from, fromPiece);
        this.setBoardCellPieceSymbol(lastMove.to, toPiece);
        this.stateValid.set(false);
      }
    } else {
      if (this.displayedMoveList().length < this.moveMadeList().length) {
        const redoMove = this.moveMadeList()[this.displayedMoveList().length];
        const piece = this.getBoardCellPieceSymbol(redoMove.from);

        this.displayedMoveList.update((displayedMoveList) => [
          ...displayedMoveList,
          {
            ...redoMove,
            capturedPiece: this.getBoardCellPieceSymbol(redoMove.to),
          },
        ]);
        this.setBoardCellPieceSymbol(redoMove.to, piece);
        this.setBoardCellPieceSymbol(redoMove.from, null);
      } else {
        this.stateValid.set(true);
      }
    }
  }

  public fromCoordinatesToBoardCellNotation(
    coordinates: [number, number],
  ): boardCellNotation {
    return String.fromCharCode(97 + coordinates[0]).concat(
      '' + coordinates[1],
    ) as boardCellNotation;
  }

  public fromBoardCellLetterNotationToCoordinates(
    cellNotation: boardCellNotation,
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
