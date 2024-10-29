import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ChessService } from '../boards/services/chess.service';

export function fenValidator(chessService: ChessService): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    return !chessService.isFenValid(control.value)
      ? { invalidFen: { value: control.value } }
      : null;
  };
}
