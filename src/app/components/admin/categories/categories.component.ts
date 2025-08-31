import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';

interface Category {
  id: number;
  name: string;
  description: string;
}

interface CategoryRequest {
  name: string;
  description: string;
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

interface CategoriesResponse {
  totalElements: number;
  totalPages: number;
  size: number;
  content: Category[];
  number: number;
  sort: Sort;
  numberOfElements: number;
  pageable: Pageable;
  first: boolean;
  last: boolean;
  empty: boolean;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css'],
})
export class CategoriesComponent implements OnInit {
  private baseUrl = 'https://order-system-446w.onrender.com/api/categories';

  categories: Category[] = [];
  filteredCategories: Category[] = [];

  categoryForm: CategoryRequest = {
    name: '',
    description: '',
  };

  isLoading = false;
  isEditing = false;
  editingId: number | null = null;

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  searchQuery = '';

  successMessage = '';
  errorMessage = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.clearMessages();

    const params = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('size', this.pageSize.toString())
      .set('sort', '');

    this.getAllCategories(params).subscribe({
      next: (response: CategoriesResponse) => {
        this.categories = response.content || [];
        this.filteredCategories = [...this.categories];
        this.totalPages = response.totalPages || 0;
        this.totalElements = response.totalElements || 0;
        this.isLoading = false;

        if (this.searchQuery) {
          this.applySearch();
        }
      },
      error: (error) => {
        this.handleError('Error al cargar las categorías', error);
        this.isLoading = false;
      },
    });
  }

  createCategory(): void {
    if (!this.validateForm()) return;

    this.isLoading = true;
    this.clearMessages();

    this.postCategory(this.categoryForm).subscribe({
      next: (response: Category) => {
        this.showSuccessMessage('Categoría creada exitosamente');
        this.resetForm();
        this.loadCategories();
      },
      error: (error) => {
        this.handleError('Error al crear la categoría', error);
        this.isLoading = false;
      },
    });
  }

  updateCategory(): void {
    if (!this.validateForm() || !this.editingId) return;

    this.isLoading = true;
    this.clearMessages();

    this.putCategory(this.editingId, this.categoryForm).subscribe({
      next: (response: Category) => {
        this.showSuccessMessage('Categoría actualizada exitosamente');
        this.resetForm();
        this.loadCategories();
      },
      error: (error) => {
        this.handleError('Error al actualizar la categoría', error);
        this.isLoading = false;
      },
    });
  }

  deleteCategory(id: number): void {
    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    this.removeCategoryById(id).subscribe({
      next: () => {
        this.showSuccessMessage('Categoría eliminada exitosamente');
        this.loadCategories();
      },
      error: (error) => {
        this.handleError('Error al eliminar la categoría', error);
        this.isLoading = false;
      },
    });
  }

  editCategory(id: number): void {
    this.isLoading = true;
    this.clearMessages();

    this.getCategoryById(id).subscribe({
      next: (category: Category) => {
        this.categoryForm = {
          name: category.name,
          description: category.description,
        };
        this.isEditing = true;
        this.editingId = id;
        this.isLoading = false;
      },
      error: (error) => {
        this.handleError('Error al cargar la categoría', error);
        this.isLoading = false;
      },
    });
  }

  /* */
  private getAllCategories(params: HttpParams): Observable<CategoriesResponse> {
    return this.http.get<CategoriesResponse>(this.baseUrl, { params });
  }

  private postCategory(category: CategoryRequest): Observable<Category> {
    return this.http.post<Category>(this.baseUrl, category);
  }

  private putCategory(
    id: number,
    category: CategoryRequest
  ): Observable<Category> {
    return this.http.put<Category>(`${this.baseUrl}/${id}`, category);
  }

  private removeCategoryById(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private getCategoryById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.baseUrl}/${id}`);
  }

  onSubmit(): void {
    if (this.isEditing) {
      this.updateCategory();
    } else {
      this.createCategory();
    }
  }

  private validateForm(): boolean {
    if (!this.categoryForm.name.trim()) {
      this.showErrorMessage('El nombre es requerido');
      return false;
    }

    if (!this.categoryForm.description.trim()) {
      this.showErrorMessage('La descripción es requerida');
      return false;
    }

    return true;
  }

  resetForm(): void {
    this.categoryForm = {
      name: '',
      description: '',
    };
    this.isEditing = false;
    this.editingId = null;
    this.isLoading = false;
  }

  cancelEdit(): void {
    this.resetForm();
    this.clearMessages();
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadCategories();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadCategories();
    }
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadCategories();
    }
  }

  changePageSize(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadCategories();
  }

  searchCategories(): void {
    this.applySearch();
  }

  private applySearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredCategories = [...this.categories];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredCategories = this.categories.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query)
    );
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filteredCategories = [...this.categories];
  }

  onSearchChange(): void {
    this.applySearch();
  }

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

  get hasCategories(): boolean {
    return this.filteredCategories.length > 0;
  }

  get canGoPrevious(): boolean {
    return this.currentPage > 0;
  }

  get canGoNext(): boolean {
    return this.currentPage < this.totalPages - 1;
  }

  get submitButtonText(): string {
    return this.isEditing ? 'Actualizar Categoría' : 'Agregar Categoría';
  }

  get formTitle(): string {
    return this.isEditing ? 'Editar Categoría' : 'Agregar Nueva Categoría';
  }

  get paginationInfo(): string {
    const start = this.currentPage * this.pageSize + 1;
    const end = Math.min(start + this.pageSize - 1, this.totalElements);
    return `Mostrando ${start} - ${end} de ${this.totalElements} elementos`;
  }

  trackByCategory(index: number, category: Category): number {
    return category.id;
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
}
