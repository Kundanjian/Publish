import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { AuthApiService } from '../../core/services/auth-api.service';
import { PASSWORD_POLICY_HINT, strongPasswordValidator } from '../../core/utils/password-policy';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css']
})
export class SignupComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  otpSent = false;
  loading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  readonly passwordPolicyHint = PASSWORD_POLICY_HINT;

  readonly registerForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(/^[\d+\-\s()]{8,20}$/)]],
    password: ['', [Validators.required, Validators.minLength(8), strongPasswordValidator()]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  readonly otpForm = this.formBuilder.nonNullable.group({
    otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
  });

  requestOtp(): void {
    if (this.registerForm.invalid || this.loading) {
      this.registerForm.markAllAsTouched();
      this.errorMessage = this.validationMessage();
      this.successMessage = '';
      return;
    }

    const values = this.registerForm.getRawValue();
    const payload = {
      ...values,
      phone: values.phone.trim() ? values.phone.trim() : undefined
    };
    if (values.password !== values.confirmPassword) {
      this.errorMessage = 'Password and confirm password must match.';
      this.successMessage = '';
      return;
    }

    this.otpSent = true;
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authApi
      .requestRegistrationOtp(payload)
      .pipe(
        timeout(8000),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
        },
        error: (error: unknown) => {
          this.errorMessage = this.extractErrorMessage(error, 'Unable to send OTP. Please try again.');
        }
      });
  }

  verifyOtp(): void {
    if (this.otpForm.invalid || this.loading) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authApi
      .verifyRegistrationOtp({
        email: this.registerForm.getRawValue().email,
        otp: this.otpForm.getRawValue().otp
      })
      .pipe(
        timeout(8000),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error: unknown) => {
          this.errorMessage = this.extractErrorMessage(error, 'OTP verification failed.');
        }
      });
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Backend service is not reachable. Please ensure backend is running on port 5003.';
      }

      return error.error?.message ?? fallback;
    }

    return 'Request timed out quickly. Please try again.';
  }

  togglePasswordVisibility(field: 'confirm' | 'main'): void {
    if (field === 'main') {
      this.showPassword = !this.showPassword;
      return;
    }

    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private validationMessage(): string {
    const controls = this.registerForm.controls;

    if (controls.name.hasError('required') || controls.email.hasError('required')) {
      return 'Name and email are required.';
    }

    if (controls.email.hasError('email')) {
      return 'Please enter a valid email address.';
    }

    if (controls.phone.hasError('pattern')) {
      return 'Please enter a valid mobile number (8-20 digits).';
    }

    if (controls.password.hasError('required')) {
      return 'Password is required.';
    }

    if (controls.password.hasError('weakPassword') || controls.password.hasError('minlength')) {
      return this.passwordPolicyHint;
    }

    if (controls.confirmPassword.hasError('required')) {
      return 'Confirm password is required.';
    }

    return 'Please check the highlighted fields.';
  }
}
