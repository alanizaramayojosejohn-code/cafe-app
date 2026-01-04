import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Category, CategoryFormData } from '../../models/category';
import { FirebaseDatabaseService } from '../firebase-database/firebase-database';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private firebaseDb = inject(FirebaseDatabaseService);
  private readonly COLLECTION_PATH = 'categories';

  createCategory(data: CategoryFormData): Promise<string> {
    return this.firebaseDb.create<Category>(this.COLLECTION_PATH, data);
  }

  getAllCategories(): Promise<Category[]> {
    return this.firebaseDb.getAll<Category>(this.COLLECTION_PATH);
  }

  listenCategories(): Observable<Category[]> {
    return this.firebaseDb.listen<Category>(this.COLLECTION_PATH);
  }

  updateCategory(id: string, data: CategoryFormData): Promise<void> {
    return this.firebaseDb.update<Category>(this.COLLECTION_PATH, id, data);
  }

  deleteCategory(id: string): Promise<void> {
    return this.firebaseDb.delete(this.COLLECTION_PATH, id);
  }

  // Lógica de negocio específica (puedes agregar validaciones aquí)
  validateCategoryName(name: string): boolean {
    return name.trim().length >= 3;
  }
}
