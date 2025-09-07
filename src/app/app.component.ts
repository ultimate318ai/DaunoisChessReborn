import { Component, signal } from '@angular/core';
import { GameType, SkillLevel } from './game-menu/gameSettings';
import { PlayerColor } from './boards/services/chessTypes';
import { GameMenuComponent } from './game-menu/game-menu.component';
import { GameStatusComponent } from './game-status/game-status.component';
import { StockfishBoardComponent } from './boards/stockfish-board/stockfish-board.component';

export interface ChessGameSettings {
  fen: string;
  gameType: GameType;
  skillLevel: SkillLevel;
  playerColor: PlayerColor;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [GameMenuComponent, GameStatusComponent, StockfishBoardComponent],
})
export class AppComponent {
  title = 'DaunoisChessReborn';

  settings = signal<ChessGameSettings | null>(null);
  gameLaunched = signal(false);

  gameStart(settings: ChessGameSettings) {
    this.gameLaunched.set(true);
    this.settings.set(settings);
  }
}
