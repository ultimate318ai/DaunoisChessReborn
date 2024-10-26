import { Component, Input } from '@angular/core';
import { Move } from 'chess.ts';
import { StockFishMove } from '../boards/services/chess.api.service';

@Component({
  selector: 'app-move-board',
  templateUrl: './move-board.component.html',
  styleUrls: ['./move-board.component.scss'],
})
export class MoveBoardComponent {
  @Input()
  public moves!: StockFishMove[];

  get chessMoves() {
    return this.moves;
  }

  get lastMove(): StockFishMove | undefined {
    if (!this.moves.length) return undefined;
    return this.moves[this.moves.length - 1];
  }

  moveBoardIndex(moveIndex: number): number {
    return moveIndex / 2 + 1;
  }
}
