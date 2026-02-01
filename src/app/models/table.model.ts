import { Timestamp } from '@angular/fire/firestore';

export type TableStatus = 'disponible' | 'ocupada' | 'reservada';

export interface Table {
  id: string;
  name: string;
  number: number;
  capacity: number;
  status: TableStatus;
  location?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TableCreate extends Omit<Table, 'id' | 'createdAt' | 'updatedAt'> {}

export const TABLES_SEED: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Mesa 1', number: 1, capacity: 4, status: 'disponible', location: 'Planta baja' },
  { name: 'Mesa 2', number: 2, capacity: 4, status: 'disponible', location: 'Planta baja' },
  { name: 'Mesa 3', number: 3, capacity: 2, status: 'disponible', location: 'Planta baja' },
  { name: 'Mesa 4', number: 4, capacity: 6, status: 'disponible', location: 'Planta baja' },
  { name: 'Mesa 5', number: 5, capacity: 4, status: 'disponible', location: 'Segundo piso' },
  { name: 'Mesa 6', number: 6, capacity: 2, status: 'disponible', location: 'Segundo piso' },
  { name: 'Para llevar', number: 0, capacity: 0, status: 'disponible', location: 'Mostrador' }
];
