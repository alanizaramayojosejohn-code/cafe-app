import { Timestamp } from '@angular/fire/firestore';
import { FieldValue } from '@angular/fire/firestore'

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
  /** Stock disponible. Solo aplica a productos no comestibles. undefined = sin trackear. */
  stock?: number;
  /** Costo de elaboración o adquisición por unidad (Bs). undefined = no registrado. Acepta decimales. */
  cost?: number;
}

export interface ProductCreate extends Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'imageUrl' | 'imagePath' | 'recipeUrl' | 'recipePath'> {
}

export interface ProductUpdate extends Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>> {
  updatedAt?: FieldValue
}

export interface FileUploadData {
  imageUrl?: string
  imagePath?: string
  recipeUrl?: string
  recipePath?: string
}
