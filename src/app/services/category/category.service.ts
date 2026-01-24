import { Injectable, inject } from '@angular/core'
import {
   Firestore,
   collection,
   collectionData,
   doc,
   addDoc,
   updateDoc,
   deleteDoc,
   serverTimestamp,
} from '@angular/fire/firestore'
import { Observable } from 'rxjs'
import { Category, CATEGORIES_SEED } from '../../models/category.model'

@Injectable()
export class CategoryService {
   private firestore = inject(Firestore)
   private categoriesCollection = collection(this.firestore, 'categories')

   getCategories(): Observable<Category[]> {
      return collectionData(this.categoriesCollection, { idField: 'id' }) as Observable<Category[]>
   }

   async addCategory(category: Omit<Category, 'createdAt' | 'updatedAt'>) {
      return addDoc(this.categoriesCollection, {
         ...category,
         createdAt: serverTimestamp(),
         updatedAt: serverTimestamp(),
      })
   }

   async updateCategory(id: string, category: Partial<Category>) {
      const categoryDoc = doc(this.firestore, 'categories', id)
      return updateDoc(categoryDoc, {
         ...category,
         updatedAt: serverTimestamp(),
      })
   }

   async deleteCategory(id: string) {
      const categoryDoc = doc(this.firestore, 'categories', id)
      return deleteDoc(categoryDoc)
   }

   async seedCategories() {
      const promises = CATEGORIES_SEED.map((cat) => this.addCategory(cat))
      return Promise.all(promises)
   }
}
