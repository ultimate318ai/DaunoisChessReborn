import { Component, OnInit, Input } from '@angular/core';
import { BoardService, PieceSymbol, boardCellNotation, boardCellsType } from './services/board.service';

@Component({
  selector: 'app-chess-board',
  templateUrl: './chess-board.component.html',
  styleUrls: ['./chess-board.component.scss'],
})
export class ChessBoardComponent implements OnInit {
  @Input()
  public fen!: string;

  private boardCells: boardCellsType = {};

  constructor(private boardService: BoardService){}


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
}
