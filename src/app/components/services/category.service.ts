import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CategoryDto } from '../../dtos/category.dto';

// Interface para manejar la respuesta paginada
interface PagedResponse<T> {
  totalElements: number;
  totalPages: number;
  size: number;
  content: T[];
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  pageable: any;
  first: boolean;
  last: boolean;
  empty: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private baseUrl = 'https://order-system-446w.onrender.com/api/categories';

  constructor(private http: HttpClient) {}

  getAll(): Observable<CategoryDto[]> {
    const params = new HttpParams()
      .set('page', '1073741824')
      .set('size', '1073741824')
      .set('sort', ''); // Agregar el parámetro sort vacío

    return this.http.get<PagedResponse<CategoryDto>>(this.baseUrl, { params })
      .pipe(
        map(response => {
          console.log('Respuesta del API:', response); // Para debugging
          return response.content || [];
        }),
        catchError(error => {
          console.error('Error al obtener categorías:', error);
          return of([]); // Retorna array vacío en caso de error
        })
      );
  }

  // Método adicional si necesitas toda la información de paginación
  getAllPaged(): Observable<PagedResponse<CategoryDto>> {
    const params = new HttpParams()
      .set('page', '1073741824')
      .set('size', '1073741824')
      .set('sort', '');

    return this.http.get<PagedResponse<CategoryDto>>(this.baseUrl, { params })
      .pipe(
        catchError(error => {
          console.error('Error al obtener categorías paginadas:', error);
          // Retorna una respuesta vacía en caso de error
          return of({
            totalElements: 0,
            totalPages: 0,
            size: 0,
            content: [],
            number: 0,
            sort: { empty: true, sorted: false, unsorted: true },
            numberOfElements: 0,
            pageable: {},
            first: true,
            last: true,
            empty: true
          });
        })
      );
  }

  getById(id: number): Observable<CategoryDto> {
    return this.http.get<CategoryDto>(`${this.baseUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error al obtener categoría por ID:', error);
          throw error;
        })
      );
  }

  create(category: CategoryDto): Observable<CategoryDto> {
    return this.http.post<CategoryDto>(this.baseUrl, category)
      .pipe(
        catchError(error => {
          console.error('Error al crear categoría:', error);
          throw error;
        })
      );
  }

  update(id: number, category: CategoryDto): Observable<CategoryDto> {
    return this.http.put<CategoryDto>(`${this.baseUrl}/${id}`, category)
      .pipe(
        catchError(error => {
          console.error('Error al actualizar categoría:', error);
          throw error;
        })
      );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error al eliminar categoría:', error);
          throw error;
        })
      );
  }
}
