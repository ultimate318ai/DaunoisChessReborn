import { Component } from '@angular/core';

@Component({
  selector: 'app-game-status',
  templateUrl: './game-status.component.html',
  styleUrls: ['./game-status.component.scss'],
})
export class GameStatusComponent {
  get gameFinished(): boolean {
    return false;
  }

  get gameStatus(): string {
    return '';
  }
}
