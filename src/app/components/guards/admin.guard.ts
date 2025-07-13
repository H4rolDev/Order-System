import { CanActivate, CanActivateFn, Router } from '@angular/router';
import { TokenStorageService } from '../services/token-storage.service';
import { inject } from '@angular/core';

export const AdminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const tokenService = inject(TokenStorageService);

  const user = tokenService.getUser();
  if (user?.rol === 'ADMIN') {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
