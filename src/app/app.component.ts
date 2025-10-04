import { Component, computed, inject } from '@angular/core';
import { StockfishBoardComponent } from './boards/stockfish-board/stockfish-board.component';
import { GameMenuComponent } from './game-menu/game-menu.component';
import { GameStatusComponent } from './game-status/game-status.component';
import { ChessGameSettings, GameStore } from './game.store';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [GameMenuComponent, StockfishBoardComponent, GameStatusComponent],
})
export class AppComponent {
  private readonly store = inject(GameStore);

  readonly isGameSet = computed(() => this.store.isGameSet());
  readonly isGameLaunched = computed(() => this.store.isGameLaunched());
  readonly isGameOver = computed(() => this.store.isGameOver());
  readonly settings = computed(() => this.store.settings());

  onGameStart(settings: ChessGameSettings) {
    this.store.onGameStart(settings);
  }

  onRematch(): void {
    this.store.onRematch();
  }

  onGameOver(): void {
    this.store.onGameOver();
  }

  onNewGame(): void {
    this.store.onNewGame();
  }
}
