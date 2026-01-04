import { Injectable, inject, NgZone } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Category } from '../../models/category';

@Injectable({
  providedIn: 'root'
})
export class CategoryFirestoreService {
  private firestore = inject(Firestore);
  private ngZone = inject(NgZone);
  private readonly COLLECTION_NAME = 'categories';

  // CREATE - Agregar nueva categoría
  async createCategory(category: Category): Promise<string> {
    const categoriesRef = collection(this.firestore, this.COLLECTION_NAME);
    const docRef = await addDoc(categoriesRef, {
      name: category.name
    });
    return docRef.id;
  }

  // READ - Obtener todas las categorías (una vez)
  async getAllCategories(): Promise<Category[]> {
    const categoriesRef = collection(this.firestore, this.COLLECTION_NAME);
    const snapshot = await getDocs(categoriesRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data()['name']
    }));
  }

  // READ - Escuchar cambios en tiempo real
  listenCategories(): Observable<Category[]> {
    return new Observable(observer => {
      const categoriesRef = collection(this.firestore, this.COLLECTION_NAME);

      const unsubscribe = onSnapshot(categoriesRef,
        (snapshot) => {
          this.ngZone.run(() => {
            const categories = snapshot.docs.map(doc => ({
              id: doc.id,
              name: doc.data()['name']
            }));
            observer.next(categories);
          });
        },
        (error) => {
          this.ngZone.run(() => {
            console.error('Error en listenCategories:', error);
            observer.error(error);
          });
        }
      );

      return () => unsubscribe();
    });
  }

  // UPDATE - Actualizar categoría
  async updateCategory(id: string, category: Category): Promise<void> {
    const categoryDoc = doc(this.firestore, this.COLLECTION_NAME, id);
    await updateDoc(categoryDoc, {
      name: category.name
    });
  }

  // DELETE - Eliminar categoría
  async deleteCategory(id: string): Promise<void> {
    const categoryDoc = doc(this.firestore, this.COLLECTION_NAME, id);
    await deleteDoc(categoryDoc);
  }
}
