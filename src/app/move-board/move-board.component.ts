import { Component, Input } from '@angular/core';
import { Move } from '../boards/services/chess.api.service';

@Component({
  selector: 'app-move-board',
  templateUrl: './move-board.component.html',
  styleUrls: ['./move-board.component.scss'],
  imports: [],
})
export class MoveBoardComponent {
  @Input()
  public moves!: Move[];

  get chessMoves() {
    return this.moves;
  }

  get lastMove(): Move | undefined {
    if (!this.moves.length) return undefined;
    return this.moves[this.moves.length - 1];
  }

  moveBoardIndex(moveIndex: number): number {
    return moveIndex / 2 + 1;
  }
}
