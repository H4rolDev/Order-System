// order.dto.ts
export interface Order {
  id: number;
  userEmail: string;
  total: number; // Backend usa 'total', no 'totalAmount'
  date: string;
  status: OrderStatus;
  orderDetails: OrderDetail[]; // Backend usa 'orderDetails', no 'orderProducts'
}

export interface OrderDetail {
  id: number;
  productName: string;
  quantity: number;
  price: number; // Backend usa 'price', no 'unitPrice'
  subTotal: number;
}

export type OrderStatus = 'PENDIENTE' | 'CONFIRMADO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';

export interface OrderResponse {
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  size: number;
  content: Order[];
  number: number;
  sort: Sort;
  numberOfElements: number;
  pageable: Pageable;
  empty: boolean;
}

export interface Sort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

export interface Pageable {
  offset: number;
  sort: Sort;
  pageNumber: number;
  pageSize: number;
  unpaged: boolean;
  paged: boolean;
}

export interface OrderFilters {
  userId: number | null;
  status: string;
  startDate: string;
  endDate: string;
}

export interface CreateOrderRequest {
  items: OrderItem[];
}

export interface UpdateOrderRequest {
  items: OrderItem[];
}

export interface OrderItem {
  productId: number;
  quantity: number;
}
