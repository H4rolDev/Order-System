import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TokenStorageService } from '../../services/token-storage.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true, // 👈 Esto es lo que faltaba
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private tokenStorage: TokenStorageService,
    private router: Router
  ) {}

  onSubmit() {
    this.authService.login(this.email, this.password).subscribe({
      next: (data) => {
        this.tokenStorage.saveToken(data.token);
        this.tokenStorage.saveUser(data);

        const rol = data.rol?.toUpperCase();
        if (rol === 'ADMIN') {
          this.router.navigate(['/admin/products']);
        } else if (rol === 'CLIENTE') {
          this.router.navigate(['/customer/home-customer']);
        } else {
          this.errorMessage = 'No estás registrado.';
        }
      },
      error: (err) => {
        this.errorMessage = 'Credenciales inválidas';
        console.error(err);
      }
    });
  }
}
