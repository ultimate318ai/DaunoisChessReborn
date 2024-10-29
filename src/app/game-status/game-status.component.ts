import { Component } from '@angular/core';
import { ChessService } from '../boards/services/chess.service';

@Component({
  selector: 'app-game-status',
  templateUrl: './game-status.component.html',
  styleUrls: ['./game-status.component.scss'],
})
export class GameStatusComponent {
  constructor(private chessService: ChessService) {}

  get gameFinished(): boolean {
    return this.chessService.isGameFinished();
  }

  get gameStatus(): string {
    return this.chessService.getEndGameStatus();
  }
}
