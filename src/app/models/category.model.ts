import { Timestamp } from "@angular/fire/firestore";
export interface Category {
  id?: string;           // ID del documento en Firestore
  name: string;          // Nombre de la categoría
  order: number;         // Orden de visualización
  createdAt?: Timestamp;      // Fecha de creación
  updatedAt?: Date;      // Fecha de actualización
}

export const CATEGORIES_SEED: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Iced', order: 1 },
  { name: 'Jugo', order: 2 },
  { name: 'Bebida Caliente', order: 3 },
  { name: 'Masita', order: 4 },
  { name: 'Sandwich', order: 5 },
  { name: 'Hamburguesa', order: 6 },
  { name: 'Nachos', order: 7 },
  { name: 'Llavero', order: 8 },
  { name: 'Peluche', order: 9 },
  { name: 'Estatua 3D', order: 10 },
  { name: 'Collar', order: 11 },
  { name: 'Ropa para mascotas', order: 12 },
  { name: 'Medias', order: 13 },
  { name: 'Guantes', order: 14 }
];
