import { Component, OnInit, Input } from '@angular/core';
import { BoardService, boardCellNotation, boardCellsType } from './board.service';

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

  get chessBoardCells() {
    return Object.entries(this.boardCells);
  }
}
