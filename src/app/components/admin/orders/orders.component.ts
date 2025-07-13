// orders.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';

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
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.clearMessages();
    const params = new HttpParams()
      .set('page', this.currentPage)
      .set('size', this.pageSize)
      .set('dateRangeValid', true);

    this.http.get<OrdersResponse>('http://localhost:8080/api/v1/orders/admin', { params }).subscribe({
      next: (res) => {
        this.orders = res.content || [];
        this.totalPages = res.totalPages;
        this.isLoading = false;
      },
      error: (error) => {
        this.handleError('Error al cargar órdenes', error);
      }
    });
  }

  cancelOrder(id: number, status: string): void {
    if (!['PENDIENTE', 'CONFIRMADO'].includes(status)) {
      this.showErrorMessage('Solo se puede cancelar una orden pendiente o confirmada');
      return;
    }
    if (!confirm('¿Estás seguro de que quieres cancelar esta orden?')) return;

    this.http.put(`http://localhost:8080/api/v1/orders/${id}/cancel`, {}).subscribe({
      next: () => {
        this.showSuccessMessage('Orden cancelada correctamente');
        this.loadOrders();
      },
      error: (err) => this.handleError('Error al cancelar la orden', err)
    });
  }

  confirmOrder(id: number, status: string): void {
    if (status !== 'PENDIENTE') return;
    this.http.put(`http://localhost:8080/api/v1/orders/${id}/confirm`, {}).subscribe({
      next: () => {
        this.showSuccessMessage('Orden confirmada');
        this.loadOrders();
      },
      error: (err) => this.handleError('Error al confirmar la orden', err)
    });
  }

  sendOrder(id: number, status: string): void {
    if (status !== 'CONFIRMADO') return;
    this.http.put(`http://localhost:8080/api/v1/orders/${id}/send`, {}).subscribe({
      next: () => {
        this.showSuccessMessage('Orden marcada como enviada');
        this.loadOrders();
      },
      error: (err) => this.handleError('Error al enviar la orden', err)
    });
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadOrders();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadOrders();
    }
  }

  get canGoPrevious(): boolean {
    return this.currentPage > 0;
  }

  get canGoNext(): boolean {
    return this.currentPage < this.totalPages - 1;
  }

  private showSuccessMessage(msg: string): void {
    this.successMessage = msg;
    this.clearAfterDelay();
  }

  private showErrorMessage(msg: string): void {
    this.errorMessage = msg;
    this.clearAfterDelay();
  }

  private handleError(msg: string, err: any): void {
    console.error(err);
    this.showErrorMessage(msg);
    this.isLoading = false;
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  private clearAfterDelay(): void {
    setTimeout(() => this.clearMessages(), 4000);
  }
}
