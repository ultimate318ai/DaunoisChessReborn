import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { GAME_TYPES, OPPONENTS } from './gameSettings';

@Component({
  selector: 'app-game-menu',
  templateUrl: './game-menu.component.html',
  styleUrls: ['./game-menu.component.scss'],
})
export class GameMenuComponent {
  @Output() gameLaunched: EventEmitter<null> = new EventEmitter();

  private _gameForm = new FormGroup({
    gameType: new FormControl(),
    gameWith: new FormControl(),
  });

  private _gameTypes = GAME_TYPES;

  private _opponents = OPPONENTS;

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
    this.gameLaunched.emit(null);
  }
}
