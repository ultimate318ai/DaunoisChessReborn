import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { GAME_TYPES, OPPONENTS, SKILL_LEVEL } from './gameSettings';
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
    skillLevel: new FormControl(),
    fen: new FormControl(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      [Validators.required, fenValidator(this.chessService)]
    ),
  });

  private _gameTypes = GAME_TYPES;

  private _opponents = OPPONENTS;

  private _skillLevels = SKILL_LEVEL;

  get gameForm() {
    return this._gameForm;
  }

  get opponents(): string[] {
    return this._opponents;
  }

  get gameTypes(): string[] {
    return this._gameTypes;
  }

  get skillLevels(): number[] {
    return this._skillLevels;
  }

  get fen(): string | null | undefined {
    return this._gameForm.get('fen')?.value;
  }

  get skillLevel(): number | null | undefined {
    return this._gameForm.get('skillLevel')?.value;
  }

  get opponent(): string | null | undefined {
    return this._gameForm.get('gameWith')?.value;
  }

  launchGame(): void {
    if (this.fen) this.gameLaunched.emit(this.fen);
  }
}
