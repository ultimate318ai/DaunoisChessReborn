import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { GAME_TYPES, OPPONENTS } from './gameSettings';
import { ChessService } from '../chess-board/services/chess.service';
import { fenValidator } from './fen-validator.directive';

@Component({
  selector: 'app-game-menu',
  templateUrl: './game-menu.component.html',
  styleUrls: ['./game-menu.component.scss'],
})
export class GameMenuComponent {
  @Output() gameLaunched: EventEmitter<string> = new EventEmitter();

  constructor(private chessService: ChessService) {}

  private _gameForm = new FormGroup({
    gameType: new FormControl(),
    gameWith: new FormControl(),
    fen: new FormControl('', [
      Validators.required,
      fenValidator(this.chessService),
    ]),
  });

  private _gameTypes = GAME_TYPES;

  private _opponents = OPPONENTS;

  fen: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  get gameForm() {
    return this._gameForm;
  }

  get opponents(): string[] {
    return this._opponents;
  }

  get gameTypes(): string[] {
    return this._gameTypes;
  }

  launchGame(): void {
    this.gameLaunched.emit(this.fen);
  }
}
