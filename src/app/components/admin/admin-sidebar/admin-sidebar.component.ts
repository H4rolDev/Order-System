import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css'
})
export class AdminSidebarComponent {
  isCollapsed = false;
  userEmail = '';
  menuItems = [
    {
      icon: 'fas fa-box',
      label: 'Productos',
      route: '/admin/products',
      badge: null
    },
    {
      icon: 'fas fa-tags',
      label: 'Categorías',
      route: '/admin/categories',
      badge: null
    },
    {
      icon: 'fas fa-shopping-cart',
      label: 'Pedidos',
      route: '/admin/orders',
      badge: '3'
    }
  ];

  constructor(private router: Router) {
    const authUser = localStorage.getItem('auth-user');
    if (authUser) {
      try {
        const user = JSON.parse(authUser);
        this.userEmail = user.email || '';
      } catch (error) {
        console.error('Error al parsear auth-user:', error);
      }
    }
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  logout(): void {
    localStorage.removeItem('auth-user');
    localStorage.removeItem('auth-token');
    this.router.navigate(['/login']);
  }
}
