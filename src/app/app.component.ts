import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent {
  title = 'DaunoisChessReborn';

  fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  gameLaunched = true; //TODO: remove this change
  gameStart(fen: string) {
    this.gameLaunched = true;
    this.fen = fen;
  }
}
