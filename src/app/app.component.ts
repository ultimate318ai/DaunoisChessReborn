import { Component } from '@angular/core';
import { GameType, SkillLevel } from './game-menu/gameSettings';
import { PlayerColor } from './boards/services/chessTypes';

export interface ChessGameSettings {
  fen: string
  gameType: GameType
  skillLevel: SkillLevel
  playerColor: PlayerColor
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent {
  title = 'DaunoisChessReborn';

  settings: ChessGameSettings | null = null

  gameLaunched = false;
  gameStart(settings: ChessGameSettings) {
    this.gameLaunched = true;
    this.settings = settings;
  }
}
