import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-game-menu',
  templateUrl: './game-menu.component.html',
  styleUrls: ['./game-menu.component.scss'],
  standalone: true,
})
export class GameMenuComponent {
  @Output() gameLaunched: EventEmitter<null> = new EventEmitter();

  private _gameForm = new FormGroup({
    gameType: new FormControl(),
    gameWith: new FormControl(),
    difficulty: new FormControl(),
  });

  get gameForm() {
    return this._gameForm;
  }

  launchGame(): void {
    this.gameLaunched.emit(null);
  }
}
