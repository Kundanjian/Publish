import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthApiService } from '../core/services/auth-api.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthApiService);
  const router = inject(Router);

  return authService.isLoggedIn() ? router.createUrlTree(['/dashboard']) : true;
};
