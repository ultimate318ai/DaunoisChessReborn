import { Component, EventEmitter, Output } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { fenValidator } from './fen-validator.directive';
import { GAME_TYPES, GameType, PLAYER_COLORS, PlayerColor, SKILL_LEVEL, SkillLevel } from './gameSettings';
import { ChessGameSettings } from '../app.component';

@Component({
  selector: 'app-game-menu',
  templateUrl: './game-menu.component.html',
  styleUrls: ['./game-menu.component.scss'],
  imports: [ReactiveFormsModule],
})
export class GameMenuComponent {
  @Output() gameLaunched = new EventEmitter<ChessGameSettings>();

  private _gameForm = new FormGroup({
    gameType: new FormControl('Chess'),
    playerColor: new FormControl('White'),
    skillLevel: new FormControl(0),
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

  get gameTypes() {
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

  get playerColor(): PlayerColor {
    return this._gameForm.get('playerColor')?.value as PlayerColor;
  }


  get gameType(): GameType {
    return this._gameForm.get("gameType")?.value as GameType;
  }

  launchGame(): void {
    this.gameLaunched.emit({
      fen: this.fen,
      gameType: this.gameType,
      skillLevel: this.skillLevel,
      playerColor: this.playerColor === "White" ? "w" : "b"
    });
  }
}
