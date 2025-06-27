import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = async (route, state) => {
const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🛡️ AuthGuard: Checking authentication...');
  
  // Wait for auth initialization
  await authService.waitForAuthInit();
  
  const isAuthenticated = authService.isAuthenticated();
  console.log('🛡️ AuthGuard: Is authenticated:', isAuthenticated);

  if (isAuthenticated) {
    return true;
  } else {
    console.log('🛡️ AuthGuard: Not authenticated, redirecting to login');
    router.navigate(['/login']);
    return false;
  }
};

export const guestGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🛡️ GuestGuard: Checking authentication...');
  
  // Wait for auth initialization
  await authService.waitForAuthInit();
  
  const isAuthenticated = authService.isAuthenticated();
  console.log('🛡️ GuestGuard: Is authenticated:', isAuthenticated);

  if (!isAuthenticated) {
    return true;
  } else {
    console.log('🛡️ GuestGuard: Already authenticated, redirecting to profile');
    router.navigate(['/profile']);
    return false;
  }
};