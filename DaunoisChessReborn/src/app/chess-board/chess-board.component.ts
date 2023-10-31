import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { PieceSymbol, boardCellNotation, boardCellsType } from './services//chessTypes';
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

  private selectedFromPieceCell: string = "";


  constructor(private boardService: BoardService, private chessService: ChessService){}


  ngOnInit(): void {
    this.buildChessBoard();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const fenChanged = changes['fen'];
    console.log("bllblblblb")
    if (fenChanged)
    this.buildChessBoard();
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

  private resetPointedCells (): void {
    this.boardService.changeCellPointedState(this.pointedCells, false);
    this.pointedCells = [];
  }

  private resetselectedPiece (): void {
    this.selectedFromPieceCell = "";
  }

  private updateChessBoard(): void {
    this.fen = this.chessService.getGameFen();
    this.buildChessBoard();
  }

  onEmptyCellClick(cellClick: string) {
    if (this.selectedFromPieceCell){
      this.chessService.applyChessMove(this.selectedFromPieceCell, cellClick);
    }
    this.resetPointedCells();
    this.resetselectedPiece();
    this.updateChessBoard();
  }

  onCellClick(cellClicked: string): void {
    const moves = this.chessService.getMovesFromCell(cellClicked as boardCellNotation);
    console.table(moves)
    if (this.selectedFromPieceCell){
      const move = this.chessService.applyChessMove(this.selectedFromPieceCell, cellClicked);
      console.log(`move: ${move}`)
      if (move !== null) {
        this.updateChessBoard();
      }
      this.resetselectedPiece();
      this.resetPointedCells();
    }
    if (moves.length && !this.selectedFromPieceCell) {
      this.selectedFromPieceCell = moves[0].from;
    }
    this.updatePointedBoardCells(moves);
    console.log(this.selectedFromPieceCell)
  }

  private updatePointedBoardCells(moves: Move[]): void {


    const pointedCells = moves.map((move) => this.boardService.getBoardEntries().find((boardCell) => boardCell[0] === move.to)
    ).filter((pointedCell) => pointedCell !== undefined).reduce((pointedCells, pointedCell) =>  {  [...pointedCells, pointedCell?.[0]]
    },
      []
    )
    // this.boardService.changeCellPointedState(pointedCells, true);


    moves.forEach((move) => {
      const pointedCell = this.boardService.getBoardEntries().find((boardCell) => boardCell[0] === move.to);
      if (pointedCell !== undefined){
        this.boardService.changeCellPointedState([pointedCell[]])
        this.boardCells[pointedCell[0]].pointed = !this.boardCells[pointedCell[0]].pointed;
        this.pointedCells = [...this.pointedCells, pointedCell[0]];
      }
    })
  }
}
