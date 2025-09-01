import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  priceDiscount?: number;
  stock: number;
  brandName?: string;
  categoryName: string;
  storeName?: string;
  images: { url: string }[];
}

interface ProductRequest {
  name: string;
  description: string;
  price: number;
  priceDiscount: number;
  stock: number;
  brandName: string;
  categoryId: number; // Cambiado a categoryId como número
  images?: { url: string }[];
}

interface Category {
  id: number;
  name: string;
  description: string;
}

interface ProductSearchFilters {
  name?: string;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: number;
  status?: boolean;
}

interface Sort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

interface Pageable {
  offset: number;
  sort: Sort;
  unpaged: boolean;
  paged: boolean;
  pageNumber: number;
  pageSize: number;
}

interface ProductsResponse {
  totalElements: number;
  totalPages: number;
  size: number;
  content: Product[];
  number: number;
  sort: Sort;
  numberOfElements: number;
  pageable: Pageable;
  first: boolean;
  last: boolean;
  empty: boolean;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
})
export class ProductsComponent implements OnInit {
  private baseUrl = 'https://order-system-446w.onrender.com/api/products';
  private categoriesUrl = 'https://order-system-446w.onrender.com/api/categories';

  products: Product[] = [];
  categories: Category[] = [];

  // Formulario para la vista
  productForm = {
    name: '',
    description: '',
    price: 0,
    priceDiscount: 0,
    stock: 0,
    brandName: '',
    categoryId: 0,
    storeName: '', // Agregado para el formulario (no se envía a la API)
    images: [] as { url: string }[]
  };

  searchFilters: ProductSearchFilters = {};

  isLoading = false;
  isEditing = false;
  editingId: number | null = null;

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  successMessage = '';
  errorMessage = '';
  selectedFile!: File;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.http.get<any>(`${this.categoriesUrl}?page=0&size=1000`).subscribe({
      next: (response) => {
        this.categories = response.content || [];
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      },
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.clearMessages();

    let params = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('size', this.pageSize.toString());

    if (this.searchFilters.name?.trim()) {
      params = params.set('name', this.searchFilters.name.trim());
    }

    if (this.searchFilters.minPrice !== undefined && this.searchFilters.minPrice !== null) {
      params = params.set('minPrice', this.searchFilters.minPrice.toString());
    }

    if (this.searchFilters.maxPrice !== undefined && this.searchFilters.maxPrice !== null) {
      params = params.set('maxPrice', this.searchFilters.maxPrice.toString());
    }

    if (this.searchFilters.categoryId !== undefined && this.searchFilters.categoryId !== null) {
      params = params.set('categoryId', this.searchFilters.categoryId.toString());
    }

    if (this.searchFilters.status !== undefined && this.searchFilters.status !== null) {
      params = params.set('status', this.searchFilters.status.toString());
    }

    this.http.get<ProductsResponse>(this.baseUrl, { params }).subscribe({
      next: (response) => {
        this.products = response.content || [];
        this.totalPages = response.totalPages || 0;
        this.totalElements = response.totalElements || 0;
        this.isLoading = false;
      },
      error: (error) => {
        this.handleError('Error al cargar los productos', error);
        this.isLoading = false;
      },
    });
  }

  createProduct(): void {
    if (!this.validateForm()) return;

    this.isLoading = true;
    this.clearMessages();

    // Preparar el objeto para enviar según la API
    const productData: ProductRequest = {
      name: this.productForm.name,
      description: this.productForm.description || '', // Enviar string vacío si no hay descripción
      price: this.productForm.price,
      priceDiscount: this.productForm.priceDiscount || 0,
      stock: this.productForm.stock,
      brandName: this.productForm.brandName || '', // Requerido por la API
      categoryId: this.productForm.categoryId
    };

    this.http.post<Product>(this.baseUrl, productData, {
      headers: { 'Content-Type': 'application/json' }
    }).subscribe({
      next: () => {
        this.showSuccessMessage('Producto creado exitosamente');
        this.resetForm();
        this.loadProducts();
      },
      error: (error) => {
        this.handleError('Error al crear el producto', error);
        this.isLoading = false;
      }
    });
  }

  updateProduct(): void {
    if (!this.validateForm() || !this.editingId) return;

    this.isLoading = true;
    this.clearMessages();

    const productData: ProductRequest = {
      name: this.productForm.name,
      description: this.productForm.description || '',
      price: this.productForm.price,
      priceDiscount: this.productForm.priceDiscount || 0,
      stock: this.productForm.stock,
      brandName: this.productForm.brandName || '',
      categoryId: this.productForm.categoryId
    };

    this.http.put<Product>(`${this.baseUrl}/${this.editingId}`, productData, {
      headers: { 'Content-Type': 'application/json' }
    }).subscribe({
      next: () => {
        this.showSuccessMessage('Producto actualizado exitosamente');
        this.resetForm();
        this.loadProducts();
      },
      error: (error) => {
        this.handleError('Error al actualizar el producto', error);
        this.isLoading = false;
      },
    });
  }

  deleteProduct(id: number): void {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    this.http.delete<void>(`${this.baseUrl}/${id}`).subscribe({
      next: () => {
        this.showSuccessMessage('Producto eliminado exitosamente');
        this.loadProducts();
      },
      error: (error) => {
        this.handleError('Error al eliminar el producto', error);
        this.isLoading = false;
      },
    });
  }

  editProduct(id: number): void {
    this.isLoading = true;
    this.clearMessages();

    this.http.get<Product>(`${this.baseUrl}/${id}`).subscribe({
      next: (product) => {
        // Buscar el categoryId basado en el categoryName
        const category = this.categories.find(cat => cat.name === product.categoryName);

        this.productForm = {
          name: product.name,
          description: product.description,
          price: product.price,
          priceDiscount: product.priceDiscount || 0,
          stock: product.stock,
          brandName: product.brandName || '',
          categoryId: category ? category.id : 0,
          storeName: product.storeName || '', // Agregado para el formulario
          images: product.images || [],
        };
        this.isEditing = true;
        this.editingId = id;
        this.isLoading = false;
      },
      error: (error) => {
        this.handleError('Error al cargar el producto', error);
        this.isLoading = false;
      },
    });
  }

  onSubmit(): void {
    if (this.isEditing) {
      this.updateProduct();
    } else {
      this.createProduct();
    }
  }

  private validateForm(): boolean {
    if (!this.productForm.name.trim()) {
      this.showErrorMessage('El nombre es requerido');
      return false;
    }

    if (this.productForm.price < 0) {
      this.showErrorMessage('El precio debe ser mayor o igual a 0');
      return false;
    }

    if (this.productForm.stock < 0) {
      this.showErrorMessage('El stock debe ser mayor o igual a 0');
      return false;
    }

    if (!this.productForm.categoryId || this.productForm.categoryId === 0) {
      this.showErrorMessage('Debe seleccionar una categoría');
      return false;
    }

    return true;
  }

  resetForm(): void {
    this.productForm = {
      name: '',
      description: '',
      price: 0,
      priceDiscount: 0,
      stock: 0,
      brandName: '',
      categoryId: 0,
      storeName: '', // Agregado para el formulario
      images: [],
    };
    this.isEditing = false;
    this.editingId = null;
    this.isLoading = false;
    this.selectedFile = null as any;
  }

  cancelEdit(): void {
    this.resetForm();
    this.clearMessages();
  }

  // Métodos de paginación
  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadProducts();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadProducts();
    }
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadProducts();
    }
  }

  searchProducts(): void {
    this.currentPage = 0;
    this.loadProducts();
  }

  clearSearch(): void {
    this.searchFilters = {};
    this.currentPage = 0;
    this.loadProducts();
  }

  // Métodos de utilidad
  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    this.clearMessagesAfterDelay();
  }

  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    this.clearMessagesAfterDelay();
  }

  private handleError(message: string, error: any): void {
    console.error('Error:', error);
    let errorMsg = message;

    if (error.error?.message) {
      errorMsg += ': ' + error.error.message;
    } else if (error.message) {
      errorMsg += ': ' + error.message;
    }

    this.showErrorMessage(errorMsg);
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  private clearMessagesAfterDelay(): void {
    setTimeout(() => {
      this.clearMessages();
    }, 5000);
  }

  getStockClass(stock: number): string {
    if (stock === 0) return 'stock-empty';
    if (stock <= 10) return 'stock-low';
    return 'stock-normal';
  }

  getStatusClass(status: boolean): string {
    return status ? 'status-active' : 'status-inactive';
  }

  // Getters para la vista
  get hasProducts(): boolean {
    return this.products.length > 0;
  }

  get canGoPrevious(): boolean {
    return this.currentPage > 0;
  }

  get canGoNext(): boolean {
    return this.currentPage < this.totalPages - 1;
  }

  get submitButtonText(): string {
    return this.isEditing ? 'Actualizar Producto' : 'Agregar Producto';
  }

  get formTitle(): string {
    return this.isEditing ? 'Editar Producto' : 'Agregar Nuevo Producto';
  }

  get paginationInfo(): string {
    const start = this.currentPage * this.pageSize + 1;
    const end = Math.min(start + this.pageSize - 1, this.totalElements);
    return `Mostrando ${start} - ${end} de ${this.totalElements} elementos`;
  }

  trackByProduct(index: number, product: Product): number {
    return product.id;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    if (this.totalPages <= maxVisiblePages) {
      for (let i = 0; i < this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(0, this.currentPage - 2);
      const endPage = Math.min(
        this.totalPages - 1,
        startPage + maxVisiblePages - 1
      );

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }
}
