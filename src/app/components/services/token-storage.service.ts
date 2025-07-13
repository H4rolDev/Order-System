import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  private TOKEN_KEY = 'auth-token';
  private USER_KEY = 'auth-user';

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  signOut(): void {
    if (this.isBrowser()) {
      window.localStorage.clear();
    }
  }

  saveToken(token: string): void {
    if (this.isBrowser()) {
      window.localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  getToken(): string | null {
    if (this.isBrowser()) {
      return window.localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  saveUser(user: any): void {
    if (this.isBrowser()) {
      window.localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  getUser(): any {
    if (this.isBrowser()) {
      const user = window.localStorage.getItem(this.USER_KEY);
      return user ? JSON.parse(user) : null;
    }
    return null;
  }
}
