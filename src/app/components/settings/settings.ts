import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { AuthApiService } from '../../core/services/auth-api.service';
import { PASSWORD_POLICY_HINT, strongPasswordValidator } from '../../core/utils/password-policy';

type SettingsUtility = 'change-password' | 'change-profile' | 'profile-overview';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css']
})
export class SettingsComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthApiService);

  readonly currentUser = this.authService.currentUser;
  readonly passwordPolicyHint = PASSWORD_POLICY_HINT;

  activeUtility: SettingsUtility = 'profile-overview';
  savingProfile = false;
  updatingPassword = false;
  profileMessage = '';
  passwordMessage = '';
  profileError = '';
  passwordError = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  readonly utilities: Array<{ key: SettingsUtility; label: string }> = [
    { key: 'profile-overview', label: 'Change Profile' },
    { key: 'change-password', label: 'Change Password' },
    { key: 'change-profile', label: 'Change Name, Email, Number' }
  ];

  readonly profileForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(/^[\d+\-\s()]{8,20}$/)]]
  });

  readonly passwordForm = this.formBuilder.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8), strongPasswordValidator()]],
    confirmNewPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  ngOnInit(): void {
    const user = this.currentUser();
    if (user) {
      this.profileForm.patchValue({
        name: user.name,
        email: user.email,
        phone: user.phone ?? ''
      });
    }

    this.authService.syncProfile().subscribe((profile) => {
      if (!profile) {
        return;
      }

      this.profileForm.patchValue({
        name: profile.name,
        email: profile.email,
        phone: profile.phone ?? ''
      });
    });
  }

  selectUtility(key: SettingsUtility): void {
    this.activeUtility = key;
    this.profileMessage = '';
    this.passwordMessage = '';
    this.profileError = '';
    this.passwordError = '';
  }

  saveProfile(): void {
    if (this.profileForm.invalid || this.savingProfile) {
      this.profileForm.markAllAsTouched();
      this.profileError = 'Please fill valid name, email and mobile number.';
      this.profileMessage = '';
      return;
    }

    const values = this.profileForm.getRawValue();
    this.savingProfile = true;
    this.profileError = '';
    this.profileMessage = '';

    this.authService
      .updateProfile({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim() || undefined
      })
      .pipe(
        timeout(7000),
        finalize(() => {
          this.savingProfile = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.profileMessage = response.message;
          if (response.user) {
            this.profileForm.patchValue({
              name: response.user.name,
              email: response.user.email,
              phone: response.user.phone ?? ''
            });
          }
        },
        error: (error: unknown) => {
          this.profileError = this.extractError(error, 'Unable to update profile right now.');
        }
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid || this.updatingPassword) {
      this.passwordForm.markAllAsTouched();
      this.passwordError = 'Please fill all password fields correctly.';
      this.passwordMessage = '';
      return;
    }

    const values = this.passwordForm.getRawValue();
    if (values.newPassword !== values.confirmNewPassword) {
      this.passwordError = 'New password and confirm password must match.';
      this.passwordMessage = '';
      return;
    }

    this.updatingPassword = true;
    this.passwordError = '';
    this.passwordMessage = '';

    this.authService
      .updatePassword(values)
      .pipe(
        timeout(7000),
        finalize(() => {
          this.updatingPassword = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.passwordMessage = response.message;
          this.passwordForm.reset({
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: ''
          });
        },
        error: (error: unknown) => {
          this.passwordError = this.extractError(error, 'Unable to update password right now.');
        }
      });
  }

  togglePasswordVisibility(field: 'confirm' | 'current' | 'new'): void {
    if (field === 'current') {
      this.showCurrentPassword = !this.showCurrentPassword;
      return;
    }

    if (field === 'new') {
      this.showNewPassword = !this.showNewPassword;
      return;
    }

    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private extractError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Backend service is not reachable. Please ensure backend is running on port 5003.';
      }

      return error.error?.message ?? fallback;
    }

    return 'Request timed out quickly. Please try again.';
  }
}

export { SettingsComponent as Settings };
