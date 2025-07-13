export interface ProductDto {
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
