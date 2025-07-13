import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { OrderService } from '../../services/order.service';
import { OrderFilters, OrderResponse } from '../../../dtos/order.dto';
import { HttpClient, HttpParams } from '@angular/common/http';

interface OrderProduct {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface Order {
  id: number;
  userId: number;
  userEmail: string;
  totalAmount: number;
  date: string;
  status: 'PENDIENTE' | 'CONFIRMADO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';
  orderProducts: OrderProduct[];
}

interface OrdersResponse {
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  size: number;
  content: Order[];
  number: number;
  numberOfElements: number;
}

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  templateUrl: './admin-orders.component.html',
  styleUrls: ['./admin-orders.component.css'],
  imports: [CommonModule, FormsModule, AdminSidebarComponent]
})
export class AdminOrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = false;
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;
  alertMessage = '';
  alertType: 'success' | 'error' | '' = '';

  filters: OrderFilters = {
    userId: null,
    status: '',
    startDate: '',
    endDate: ''
  };

  statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'CONFIRMADO', label: 'Confirmado' },
    { value: 'ENVIADO', label: 'Enviado' },
    { value: 'ENTREGADO', label: 'Entregado' },
    { value: 'CANCELADO', label: 'Cancelado' }
  ];

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;

    const params = {
      page: this.currentPage,
      size: this.pageSize,
      userId: this.filters.userId,
      status: this.filters.status,
      startDate: this.filters.startDate ? this.filters.startDate + 'T00:00:00.000Z' : '',
      endDate: this.filters.endDate ? this.filters.endDate + 'T23:59:59.999Z' : '',
      dateRangeValid: true
    };

    this.orderService.getOrders(params).subscribe({
      next: (response: OrderResponse) => {
        this.orders = response.content;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
        this.loading = false;
      },
      error: (error) => {
        this.showAlert('Error al cargar las órdenes: ' + error.message, 'error');
        this.loading = false;
        this.orders = [];
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadOrders();
  }

  clearFilters(): void {
    this.filters = {
      userId: null,
      status: '',
      startDate: '',
      endDate: ''
    };
    this.currentPage = 0;
    this.loadOrders();
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadOrders();
  }

  getPageNumbers(): number[] {
    const startPage = Math.max(0, this.currentPage - 2);
    const endPage = Math.min(this.totalPages - 1, this.currentPage + 2);
    const pages = [];

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  canConfirm(status: string): boolean {
    return status === 'PENDIENTE';
  }

  canCancel(status: string): boolean {
    return status === 'PENDIENTE';
  }

  canSend(status: string): boolean {
    return status === 'CONFIRMADO';
  }

  canDeliver(status: string): boolean {
    return status === 'CONFIRMADO' || status === 'ENVIADO';
  }

  confirmOrder(orderId: number): void {
    this.orderService.confirmOrder(orderId).subscribe({
      next: () => {
        this.showAlert('Orden confirmada exitosamente', 'success');
        this.loadOrders();
      },
      error: (error) => {
        this.showAlert('Error al confirmar la orden: ' + error.message, 'error');
      }
    });
  }

  cancelOrder(orderId: number): void {
    if (confirm('¿Estás seguro de que quieres cancelar esta orden?')) {
      this.orderService.cancelOrder(orderId).subscribe({
        next: () => {
          this.showAlert('Orden cancelada exitosamente', 'success');
          this.loadOrders();
        },
        error: (error) => {
          this.showAlert('Error al cancelar la orden: ' + error.message, 'error');
        }
      });
    }
  }

  sendOrder(orderId: number): void {
    this.orderService.sendOrder(orderId).subscribe({
      next: () => {
        this.showAlert('Orden enviada exitosamente', 'success');
        this.loadOrders();
      },
      error: (error) => {
        this.showAlert('Error al enviar la orden: ' + error.message, 'error');
      }
    });
  }

  deliverOrder(orderId: number): void {
    this.orderService.deliverOrder(orderId).subscribe({
      next: () => {
        this.showAlert('Orden entregada exitosamente', 'success');
        this.loadOrders();
      },
      error: (error) => {
        this.showAlert('Error al entregar la orden: ' + error.message, 'error');
      }
    });
  }

  private showAlert(message: string, type: 'success' | 'error'): void {
    this.alertMessage = message;
    this.alertType = type;

    setTimeout(() => {
      this.alertMessage = '';
      this.alertType = '';
    }, 5000);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  onStartDateChange(): void {
    if (this.filters.startDate && !this.filters.endDate) {
      this.filters.endDate = this.filters.startDate;
    }
  }
}
