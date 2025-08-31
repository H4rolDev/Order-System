import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';

interface ProductDto {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  status: boolean;
  categoryId: number;
  categoryName: string;
  imageUrl?: string;
}

interface CategoryDto {
  id: number;
  name: string;
}

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  pageable: any;
  sort: any;
  empty: boolean;
}

@Component({
  selector: 'app-home-customer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home-customer.component.html',
  styleUrls: ['./home-customer.component.css'],
})
export class HomeCustomerComponent implements OnInit {
  products: ProductDto[] = [];
  categories: CategoryDto[] = [];
  isLoading = false;

  // Filtros
  filterName = '';
  filterMinPrice: number | null = null;
  filterMaxPrice: number | null = null;
  filterCategoryId: number | null = null;

  // Paginación
  page = 0;
  size = 12; // Reducido para mejor visualización
  totalElements = 0;
  totalPages = 0;

  // Carrito
  cart = new Map<number, { product: ProductDto; quantity: number }>();
  isCartOpen = false;

  // Mensajes
  statusMessage = '';
  private statusTimeout: any;

  userEmail: string | null = null;
  showUserMenu = false;
  showOrderModal = false;
  isLoggedIn = false;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    if (typeof window !== 'undefined') {
      this.isLoggedIn = localStorage.getItem('auth-token') !== null;
      this.loadUserInfo(); // solo se ejecuta en el navegador
      this.loadCategories(); // solo si estás logueado
    }

    this.loadProducts(); // Esto sí puede ejecutarse siempre
  }

  openOrderModal() {
    if(!this.isLoggedIn) {
      this.navigateToLogin();
    }
    if (this.cart.size === 0) {
      this.showMessage('No tienes productos en el carrito');
      return;
    }
    this.showOrderModal = true;
  }

  cancelOrder() {
    this.showOrderModal = false;
  }

  confirmOrder() {
  const orderPayload = {
    products: this.cartItems.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    })),
  };

  this.http
    .post<any>('https://order-system-446w.onrender.com/api/v1/orders', orderPayload)
    .subscribe({
      next: (res) => {
        this.showMessage('Orden realizada con éxito. ID: ' + res.id);
        this.cart.clear();
        this.showOrderModal = false;
        this.closeCart();
      },
      error: (err) => {
        console.error('Error al crear orden:', err);
        this.showMessage('Error al realizar la orden');
        this.showOrderModal = false;
      },
    });
}


  navigateToLogin() {
    this.router.navigate(['/login']); // Ajusta la ruta según tu configuración de rutas
  }

  // Cargar email del usuario desde localStorage o similar
  loadUserInfo() {
    if (typeof window === 'undefined') return; // asegúrate de no ejecutar en SSR

    const authUser = localStorage.getItem('auth-user');
    if (authUser) {
      try {
        const user = JSON.parse(authUser);
        this.userEmail = user.email || null;
      } catch (error) {
        console.error('Error parsing auth-user from localStorage:', error);
        this.userEmail = null;
      }
    } else {
      this.userEmail = null;
    }
  }

  // Mostrar/ocultar menú usuario al hacer click
  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  // Cerrar sesión: elimina token y limpia email, cierra menú y muestra mensaje
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('auth-user'); // Cambiar de 'userEmail' a 'auth-user'
    this.userEmail = null;
    this.showUserMenu = false;
    this.showMessage('Sesión cerrada');
  }

  // Métodos de carga de datos
  loadCategories() {
    if (!this.isLoggedIn) {
      this.categories = [];
      return;
    }

    this.http
      .get<PaginatedResponse<CategoryDto>>(
        'https://order-system-446w.onrender.com/api/categories?page=0&size=1000'
      )
      .subscribe({
        next: (response) => {
          this.categories = response.content;
        },
        error: (err) => {
          console.error('Error cargando categorías:', err);
          this.categories = [];
        },
      });
  }

  loadProducts() {
    this.isLoading = true;

    let params = new HttpParams()
      .set('page', this.page.toString())
      .set('size', this.size.toString())
      .set('sort', '')
      .set('status', 'true')
      .set('priceRangeValid', 'true');

    if (this.filterName && this.filterName.trim() !== '') {
      params = params.set('name', this.filterName.trim());
    }

    if (this.filterMinPrice != null && this.filterMinPrice > 0) {
      params = params.set('minPrice', this.filterMinPrice.toString());
    }

    if (this.filterMaxPrice != null && this.filterMaxPrice > 0) {
      params = params.set('maxPrice', this.filterMaxPrice.toString());
    }

    if (this.filterCategoryId) {
      params = params.set('categoryId', this.filterCategoryId.toString());
    }

    this.http
      .get<PaginatedResponse<ProductDto>>(
        'https://order-system-446w.onrender.com/api/products',
        { params }
      )
      .subscribe({
        next: (res) => {
          console.log('Respuesta del backend:', res);
          if (res && res.content && Array.isArray(res.content)) {
            this.products = res.content;
            this.totalElements = res.totalElements || 0;
            this.totalPages = res.totalPages || 0;
          } else {
            console.error(
              'Respuesta del backend no tiene la estructura esperada:',
              res
            );
            this.products = [];
            this.totalElements = 0;
            this.totalPages = 0;
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error cargando productos', err);
          this.products = [];
          this.totalElements = 0;
          this.totalPages = 0;
          this.isLoading = false;
          this.showMessage('Error al cargar los productos');
        },
      });
  }

  // Métodos de filtrado
  onFilterSubmit() {
    this.page = 0;
    this.loadProducts();
  }

  clearFilters() {
    this.filterName = '';
    this.filterMinPrice = null;
    this.filterMaxPrice = null;
    this.filterCategoryId = null;
    this.page = 0;
    this.loadProducts();
    this.showMessage('Filtros limpiados');
  }

  // Métodos de paginación
  changePage(newPage: number) {
    if (newPage < 0 || newPage >= this.totalPages) return;
    this.page = newPage;
    this.loadProducts();
    // Scroll to top after page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Métodos del carrito
  toggleCart() {
    this.isCartOpen = !this.isCartOpen;
  }

  closeCart() {
    this.isCartOpen = false;
  }

  addToCart(product: ProductDto) {
    if (this.cart.has(product.id)) {
      const item = this.cart.get(product.id)!;
      if (item.quantity < product.stock) {
        item.quantity++;
        this.showMessage(`${product.name} agregado al carrito`);
      } else {
        this.showMessage('No hay más stock disponible para este producto');
      }
    } else {
      if (product.stock > 0) {
        this.cart.set(product.id, { product, quantity: 1 });
        this.showMessage(`${product.name} agregado al carrito`);
      } else {
        this.showMessage('Producto sin stock disponible');
      }
    }
  }

  removeFromCart(productId: number) {
    const item = this.cart.get(productId);
    if (item) {
      this.cart.delete(productId);
      this.showMessage(`${item.product.name} eliminado del carrito`);
    }
  }

  increaseQuantity(productId: number) {
    const item = this.cart.get(productId);
    if (item && item.quantity < item.product.stock) {
      item.quantity++;
      this.showMessage('Cantidad actualizada');
    } else if (item) {
      this.showMessage(
        `No puede pedir más que el stock disponible (${item.product.stock})`
      );
    }
  }

  decreaseQuantity(productId: number) {
    const item = this.cart.get(productId);
    if (item) {
      if (item.quantity > 1) {
        item.quantity--;
        this.showMessage('Cantidad actualizada');
      } else {
        this.removeFromCart(productId);
      }
    }
  }

  updateQuantity(productId: number, quantity: number) {
    if (!this.cart.has(productId)) return;

    const item = this.cart.get(productId)!;

    if (quantity <= 0) {
      this.removeFromCart(productId);
    } else if (quantity > item.product.stock) {
      this.showMessage(
        `No puede pedir más que el stock disponible (${item.product.stock})`
      );
      item.quantity = item.product.stock;
    } else {
      item.quantity = quantity;
      this.showMessage('Cantidad actualizada');
    }
  }

  // Métodos de cálculo del carrito
  getSubtotal(): number {
    let subtotal = 0;
    this.cart.forEach((item) => {
      subtotal += item.product.price * item.quantity;
    });
    return subtotal;
  }

  getIGV(): number {
    return this.getSubtotal() * 0.18;
  }

  getTotal(): number {
    return this.getSubtotal();
  }

  getTotalItems(): number {
    let total = 0;
    this.cart.forEach((item) => {
      total += item.quantity;
    });
    return total;
  }

  get cartItems() {
    return Array.from(this.cart.values());
  }

  // Métodos de utilidad
  showMessage(message: string) {
    this.statusMessage = message;

    // Limpiar timeout anterior si existe
    if (this.statusTimeout) {
      clearTimeout(this.statusTimeout);
    }

    // Limpiar mensaje después de 3 segundos
    this.statusTimeout = setTimeout(() => {
      this.statusMessage = '';
    }, 3000);
  }

  // Métodos trackBy para optimizar el rendimiento
  trackByProductId(index: number, product: ProductDto): number {
    return product.id;
  }

  trackByCartItem(
    index: number,
    item: { product: ProductDto; quantity: number }
  ): number {
    return item.product.id;
  }

  // Método para cleanup al destruir el componente
  ngOnDestroy() {
    if (this.statusTimeout) {
      clearTimeout(this.statusTimeout);
    }
  }

  goToOrders() {
    // Verificar autenticación antes de navegar
    const token = localStorage.getItem('auth-token');
    const authUser = localStorage.getItem('auth-user');

    if (token && authUser) {
      this.router.navigate(['/customer/orders']);
    } else {
      console.log('No hay autenticación válida');
      this.router.navigate(['/login']);
    }
  }
}
