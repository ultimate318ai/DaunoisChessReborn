import { Component, EventEmitter, Output } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { fenValidator } from './fen-validator.directive';
import { GAME_TYPES, GameType, PLAYER_COLORS, SKILL_LEVEL, SkillLevel } from './gameSettings';

@Component({
  selector: 'app-game-menu',
  templateUrl: './game-menu.component.html',
  styleUrls: ['./game-menu.component.scss'],
  imports: [ReactiveFormsModule],
})
export class GameMenuComponent {
  @Output() gameLaunched = new EventEmitter();

  private _gameForm = new FormGroup({
    gameType: new FormControl(),
    gameWith: new FormControl(),
    skillLevel: new FormControl(),
    fen: new FormControl(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      [Validators.required, fenValidator()]
    ),
  });
  private _gameTypes = GAME_TYPES;


  private _skillLevels = SKILL_LEVEL;

  private _playerColorList = PLAYER_COLORS;

  get gameForm() {
    return this._gameForm;
  }

  get playerColorList() {
    return this._playerColorList;
  }

  get gameTypes(): GameType[] {
    return this._gameTypes;
  }

  get skillLevels(): SkillLevel[] {
    return this._skillLevels;
  }

  get fen(): string {
    return this._gameForm.get('fen')?.value as string;
  }

  get skillLevel(): SkillLevel {
    return this._gameForm.get('skillLevel')?.value as number;
  }

  get gameType(): GameType {
    return this._gameForm.get("gameType")?.value as string;
  }

  launchGame(): void {
    this.gameLaunched.emit({
      fen: this.fen,
      gameType: this.gameType,
      skillLevel: this.skillLevel
    });
  }
}
