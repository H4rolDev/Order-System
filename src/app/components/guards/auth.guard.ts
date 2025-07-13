import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const authUser = localStorage.getItem('auth-user');

    console.log('AuthGuard - AuthUser:', authUser ? 'Present' : 'Missing');

    if (authUser) {
      try {
        const user = JSON.parse(authUser);
        console.log('AuthGuard - User email:', user.email);
        console.log('AuthGuard - User rol:', user.rol);

        // Verificar que el usuario tenga email y rol
        if (user.email && user.rol) {
          return true;
        }
      } catch (error) {
        console.error('AuthGuard - Error parsing auth user:', error);
      }
    }

    console.log('AuthGuard - Access denied, redirecting to login');
    // Redirigir al login si no está autenticado
    this.router.navigate(['/login']);
    return false;
  }
}
