import { Timestamp } from '@angular/fire/firestore';

export type ProductType = 'comestible' | 'nocomestible';
export type ProductStatus = 'activo' | 'inactivo';

export interface Product {
  id: string;
  pokename: string;
  name: string;
  description: string;
  price: number;
  type: ProductType;
  status: ProductStatus;
  categoryId: string;
  imageUrl?: string;
  imagePath?: string;
  recipeUrl?: string;
  recipePath?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId?: string;
}
