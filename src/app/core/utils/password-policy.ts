import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const PASSWORD_POLICY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;

export const PASSWORD_POLICY_HINT =
  'Use 8-64 characters with uppercase, lowercase, number, and special character.';

export const strongPasswordValidator = (): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '');
    if (!value) {
      return null;
    }

    return PASSWORD_POLICY_REGEX.test(value) ? null : { weakPassword: true };
  };
};
