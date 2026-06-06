import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { AuthApiService } from '../../core/services/auth-api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  loading = false;
  errorMessage = '';
//HEAD
  warningMessage = '';
//
  showPassword = false;
//7f9ea7109b049d12a3c0d98ac96604b20594d1a6

  readonly loginForm = this.formBuilder.nonNullable.group({
    identifier: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required]]
  });

  login(): void {
    if (this.loginForm.invalid || this.loading) {
      this.loginForm.markAllAsTouched();
      this.errorMessage = 'Please enter email/mobile and password.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.warningMessage = '';

    this.authApi
      .loginUser(this.loginForm.getRawValue())
      .pipe(
        timeout(7000),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.warningMessage = response.databaseWarning ?? '';
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
