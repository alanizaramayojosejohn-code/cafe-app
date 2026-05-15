import { Timestamp } from '@angular/fire/firestore';
export interface Category {
  id?: string;
  name: string;
  order: number;
  createdAt?: Timestamp;
  updatedAt?: Date;
}

export const CATEGORIES_SEED: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Iced', order: 1 },
  { name: 'Jugo', order: 2 },
  { name: 'Hamburguesa', order: 3 },
  { name: 'Nachos', order: 4 },
  { name: 'Llavero', order: 5 },
  { name: 'Peluche', order: 6 },
  { name: 'Estatua 3D', order: 7 },
  { name: 'Collar', order: 8 },
  { name: 'Ropa para mascotas', order: 9 },
  { name: 'Medias', order: 10 },
  { name: 'Guantes', order: 11 },
];
