import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateOrderRequest, Order, OrderResponse, UpdateOrderRequest } from '../../dtos/order.dto';

export interface OrderItemUpdateDto {
  productId: number;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private baseUrl = 'http://localhost:8080/api/v1/orders';

  constructor(private http: HttpClient) {}

  getOrders(params: any): Observable<OrderResponse> {
    let httpParams = new HttpParams();

    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key].toString());
      }
    });

    return this.http.get<OrderResponse>(`${this.baseUrl}/admin`, { params: httpParams });
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/${id}`);
  }

  createOrder(order: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, order);
  }

  updateOrder(id: number, order: UpdateOrderRequest): Observable<Order> {
    return this.http.put<Order>(`${this.baseUrl}/${id}`, order);
  }

  confirmOrder(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/confirm`, {});
  }

  cancelOrder(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/cancel`, {});
  }

  sendOrder(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/send`, {});
  }

  deliverOrder(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/deliver`, {});
  }
}
