import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Table, TableCreate, TABLES_SEED } from '../../models/table.model';

@Injectable()
export class TableService {
  private firestore = inject(Firestore);
  private tablesCollection = collection(this.firestore, 'tables');

  getTables(): Observable<Table[]> {
    const q = query(this.tablesCollection, orderBy('number', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<Table[]>;
  }

  async createTable(tableData: TableCreate): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(this.tablesCollection, {
      ...tableData,
      createdAt: now,
      updatedAt: now
    });
    return docRef.id;
  }

  async updateTable(id: string, tableData: Partial<Table>): Promise<void> {
    const tableDoc = doc(this.firestore, `tables/${id}`);
    await updateDoc(tableDoc, {
      ...tableData,
      updatedAt: Timestamp.now()
    });
  }

  async deleteTable(id: string): Promise<void> {
    const tableDoc = doc(this.firestore, `tables/${id}`);
    await deleteDoc(tableDoc);
  }

  async seedTables(): Promise<void> {
    const now = Timestamp.now();
    for (const table of TABLES_SEED) {
      await addDoc(this.tablesCollection, {
        ...table,
        createdAt: now,
        updatedAt: now
      });
    }
  }
}
