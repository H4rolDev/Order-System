import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { formatDate } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-customer-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './customer-orders.component.html',
  styleUrls: ['./customer-orders.component.css']
})
export class CustomerOrdersComponent implements OnInit {
  orders: any[] = [];
  statusMessage = '';
  statusType: 'success' | 'error' | 'info' = 'info';
  userEmail: string | null = null;
  selectedOrder: any = null;
  editedItems: { productId: number, quantity: number }[] = [];
  showEditor = false;
  isLoading = false;
  isSaving = false;
  allProducts: { id: number, name: string, stock: number }[] = [];

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.initializeUser();
    this.loadAllProducts();
  }

  loadAllProducts() {
    // Parámetros para obtener todos los productos
    const params = new HttpParams()
      .set('status', 'true')
      .set('priceRangeValid', 'false')
      .set('page', '0')
      .set('size', '1000');

    this.http.get<any>('http://localhost:8080/api/v1/products', { params }).subscribe({
      next: (res) => {
        // La respuesta tiene la estructura: {content: [...], totalElements: ..., etc}
        if (res && res.content && Array.isArray(res.content)) {
          this.allProducts = res.content.map((p: any) => ({
            id: p.id,
            name: p.name,
            stock: p.stock
          }));
        } else {
          console.error('Estructura de respuesta inesperada:', res);
          this.allProducts = [];
        }
      },
      error: (err) => {
        console.error('Error cargando productos', err);
        this.allProducts = [];
      }
    });
  }

  private initializeUser() {
    try {
      const authUser = JSON.parse(localStorage.getItem('auth-user') || '{}');
      this.userEmail = authUser.email || null;
      const token = localStorage.getItem('token') ||
                   localStorage.getItem('auth-token') ||
                   localStorage.getItem('access-token') ||
                   localStorage.getItem('jwt-token');

      if (this.userEmail && token) {
        this.loadOrders();
      } else {
        this.showMessage('No se encontró información de autenticación válida', 'error');
        console.warn('Token o email no encontrado');
      }
    } catch (error) {
      console.error('Error al obtener información de autenticación:', error);
      this.showMessage('Error en la información de autenticación', 'error');
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ||
                 localStorage.getItem('auth-token') ||
                 localStorage.getItem('access-token') ||
                 localStorage.getItem('jwt-token');

    if (!token) {
      throw new Error('Token de autenticación no encontrado');
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  loadOrders() {
    this.isLoading = true;
    this.statusMessage = '';

    try {
      const headers = this.getAuthHeaders();
      const params = new HttpParams()
        .set('page', '0')
        .set('size', '100')
        .set('dateRangeValid', 'false');

      this.http
        .get<any>('http://localhost:8080/api/v1/orders/customer', { headers, params })
        .subscribe({
          next: (res) => {
            this.orders = res.content || [];
            this.isLoading = false;
            if (this.orders.length === 0) {
              this.showMessage('No se encontraron órdenes', 'info');
            }
          },
          error: (err) => {
            console.error('Error cargando órdenes:', err);
            this.isLoading = false;
            if (err.status === 401) {
              this.showMessage('Sesión expirada. Por favor, inicia sesión nuevamente', 'error');
            } else {
              this.showMessage('Error al cargar las órdenes', 'error');
            }
          }
        });
    } catch (error) {
      console.error('Error al configurar headers:', error);
      this.isLoading = false;
      this.showMessage('Error de autenticación', 'error');
    }
  }

  cancelOrder(orderId: number, status: string) {
    if (status !== 'PENDIENTE') {
      this.showMessage('Solo puedes cancelar órdenes en estado PENDIENTE', 'error');
      return;
    }

    if (confirm('¿Estás seguro de cancelar esta orden?')) {
      try {
        const headers = this.getAuthHeaders();
        this.http.put(`http://localhost:8080/api/v1/orders/${orderId}/cancel`, {}, { headers })
          .subscribe({
            next: () => {
              this.showMessage('Orden cancelada correctamente', 'success');
              this.loadOrders();
            },
            error: (err) => {
              console.error('Error al cancelar orden:', err);
              this.showMessage('Error al cancelar la orden', 'error');
            }
          });
      } catch (error) {
        console.error('Error al configurar headers para cancelar:', error);
        this.showMessage('Error de autenticación', 'error');
      }
    }
  }

  editOrder(order: any) {
    if (order.status !== 'PENDIENTE') return;

    this.selectedOrder = order;
    this.editedItems = order.orderProducts.map((p: any) => ({
      productId: p.productId,
      quantity: p.quantity
    }));
    this.showEditor = true;
  }

  addNewItem() {
    this.editedItems.push({
      productId: this.allProducts[0]?.id || 0,
      quantity: 1
    });
  }

  saveChanges() {
    if (!this.selectedOrder || this.isSaving) return;

    this.isSaving = true;

    try {
      const headers = this.getAuthHeaders();
      this.http.put(`http://localhost:8080/api/v1/orders/${this.selectedOrder.id}`, {
        items: this.editedItems
      }, { headers })
      .subscribe({
        next: () => {
          this.showMessage('Orden actualizada correctamente', 'success');
          this.showEditor = false;
          this.isSaving = false;
          this.loadOrders();
        },
        error: (err) => {
          console.error('Error al actualizar orden:', err);
          this.showMessage('Error al actualizar la orden', 'error');
          this.isSaving = false;
        }
      });
    } catch (error) {
      console.error('Error al configurar headers para actualizar:', error);
      this.showMessage('Error de autenticación', 'error');
      this.isSaving = false;
    }
  }

  formatDateTime(date: string): string {
    try {
      return formatDate(date, 'dd/MM/yyyy HH:mm', 'en-US');
    } catch (error) {
      console.error('Error formatting date:', error);
      return date;
    }
  }

  removeItem(index: number) {
    if (this.editedItems.length > 1) {
      this.editedItems.splice(index, 1);
    } else {
      this.showMessage('Debe mantener al menos un producto en la orden', 'error');
    }
  }

  closeEditor() {
    this.showEditor = false;
    this.selectedOrder = null;
    this.editedItems = [];
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDIENTE': return 'status-pending';
      case 'COMPLETADO': return 'status-completed';
      case 'CANCELADO': return 'status-cancelled';
      default: return 'status-default';
    }
  }

  private showMessage(message: string, type: 'success' | 'error' | 'info') {
    this.statusMessage = message;
    this.statusType = type;

    // Auto-hide message after 5 seconds
    setTimeout(() => {
      this.statusMessage = '';
    }, 5000);
  }

  increaseQuantity(index: number) {
    const product = this.allProducts.find(p => p.id === this.editedItems[index].productId);
    const maxStock = product ? product.stock : 99;

    if (this.editedItems[index].quantity < maxStock) {
      this.editedItems[index].quantity++;
    } else {
      this.showMessage(`No puedes agregar más de ${maxStock} unidades (stock disponible)`, 'error');
    }
  }

  decreaseQuantity(index: number) {
    if (this.editedItems[index].quantity > 1) {
      this.editedItems[index].quantity--;
    }
  }

  validateQuantity(index: number) {
    const product = this.allProducts.find(p => p.id === this.editedItems[index].productId);
    const maxStock = product ? product.stock : 99;

    if (this.editedItems[index].quantity > maxStock) {
      this.editedItems[index].quantity = maxStock;
      this.showMessage(`Cantidad ajustada al stock disponible (${maxStock})`, 'info');
    }

    if (this.editedItems[index].quantity < 1) {
      this.editedItems[index].quantity = 1;
    }
  }

  getProductStock(productId: number): number {
    const product = this.allProducts.find(p => p.id === productId);
    return product ? product.stock : 0;
  }

  getProductName(productId: number): string {
    const product = this.allProducts.find(p => p.id === productId);
    return product ? product.name : 'Producto no encontrado';
  }
}
