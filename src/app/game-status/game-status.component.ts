import { Component, output } from '@angular/core';

@Component({
  selector: 'app-game-status',
  templateUrl: './game-status.component.html',
  styleUrls: ['./game-status.component.scss'],
})
export class GameStatusComponent {
  rematch = output<void>();
  newGame = output<void>();

  onRematch(): void {
    this.rematch.emit();
  }

  onNewGame(): void {
    this.newGame.emit();
  }
}
