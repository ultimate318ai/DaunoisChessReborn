import { Component, OnInit, Input } from '@angular/core';
import { PieceSymbol, boardCellNotation, boardCellsType } from './services//chessTypes';
import { BoardService } from './services/board.service';
import { ChessService } from './services/chess.service';

@Component({
  selector: 'app-chess-board',
  templateUrl: './chess-board.component.html',
  styleUrls: ['./chess-board.component.scss'],
})
export class ChessBoardComponent implements OnInit {
  @Input()
  public fen!: string;

  private boardCells: boardCellsType = {};

  private pointedCells: string[] = [];

  constructor(private boardService: BoardService, private chessService: ChessService){}


  ngOnInit(): void {
    this.boardCells = this.boardService.fromFenToCellsBoards(this.fen);
  }

  piecePictureUrl(pieceSymbol: PieceSymbol) {
    return this.boardService.getUrlFromPieceSymbol(pieceSymbol);
  }

  get chessBoardCellsContents() {
    return Object.values(this.boardCells);
  }

  get chessBoardCellsKeys() {
    return Object.keys(this.boardCells);
  }

  private resetPointedCells (): void {
    this.pointedCells.forEach((oldPointedCellName: string) => {
      this.boardCells[oldPointedCellName].pointed = false;
    })
    this.pointedCells = [];
  }

  onCellClick(cellClicked: string): void {
    this.resetPointedCells();
    const moves = this.chessService.getMovesFromPiece(cellClicked as boardCellNotation);
    moves.forEach((move) => {
      const pointedCell = Object.entries(this.boardCells).find((boardCell) => boardCell[0] === move.to);
      if (pointedCell !== undefined){
        this.boardCells[pointedCell[0]].pointed = true;
        this.pointedCells = [...this.pointedCells, pointedCell[0]];
      }
    })

  }
}
