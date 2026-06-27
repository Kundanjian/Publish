import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { AuthApiService } from '../../core/services/auth-api.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './admin-login.html',
  styleUrls: ['./admin-login.css']
})
export class AdminLoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthApiService);
  private readonly router = inject(Router);

  loading = false;
  errorMessage = '';
  showPassword = false;

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submit(): void {
    if (this.loginForm.invalid || this.loading) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService
      .loginAdmin({
        identifier: this.loginForm.getRawValue().email,
        password: this.loginForm.getRawValue().password
      })
      .pipe(
        timeout(7000),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error: unknown) => {
          this.errorMessage = this.extractErrorMessage(error, 'Unable to login. Please try again.');
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

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
