import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private loginUrl = 'http://localhost:8080/api/v1/auth/login';
  private registerUrl = 'http://localhost:8080/api/v1/auth/register-customer';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(this.loginUrl, { email, password });
  }

  register(email: string, password: string): Observable<any> {
    return this.http.post(this.registerUrl, { email, password });
  }

  registerAdmin(email: string, password: string): Observable<any> {
    return this.http.post('http://localhost:8080/api/v1/auth/register', {
      email,
      password,
      rol: 'ADMIN'
    });
  }
}
