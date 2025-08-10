import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function fenValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    return !true ? { invalidFen: { value: control.value } } : null;
  };
}
