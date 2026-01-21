import { Injectable, inject } from '@angular/core'
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  DocumentReference,
} from '@angular/fire/firestore'
import { Observable } from 'rxjs'
import { Product, ProductUpdate } from '../../models/product.model'

@Injectable({
  providedIn: 'root',
})
export class ProductRepositoryService {
  private firestore = inject(Firestore)
  private productsCollection = collection(this.firestore, 'products')

  getAll(): Observable<Product[]> {
    return collectionData(this.productsCollection, { idField: 'id' }) as Observable<Product[]>
  }

  getById(id: string): Observable<Product | undefined> {
    const productDoc = doc(this.firestore, 'products', id)
    return docData(productDoc, { idField: 'id' }) as Observable<Product | undefined>
  }

  getByCategory(categoryId: string): Observable<Product[]> {
    const q = query(this.productsCollection, where('categoryId', '==', categoryId))
    return collectionData(q, { idField: 'id' }) as Observable<Product[]>
  }

  async existsByPokename(pokename: string, excludeId?: string): Promise<boolean> {
    const normalizedPokename = pokename.trim().toLowerCase()
    const q = query(this.productsCollection, where('pokename', '==', normalizedPokename))
    const snapshot = await getDocs(q)

    if (excludeId) {
      return snapshot.docs.some((doc) => doc.id !== excludeId)
    }
    return !snapshot.empty
  }

  async create(id: string, data: Partial<Product>): Promise<void> {
    const productDoc = doc(this.firestore, 'products', id)
    await setDoc(productDoc, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  async update(id: string, data: ProductUpdate): Promise<void> {
    const productDoc = doc(this.firestore, 'products', id)
    await updateDoc(productDoc, {
      ...data,
      updatedAt: serverTimestamp(),
    })
  }

  async delete(id: string): Promise<void> {
    const productDoc = doc(this.firestore, 'products', id)
    await deleteDoc(productDoc)
  }

  getDocumentReference(id: string): DocumentReference {
    return doc(this.firestore, 'products', id)
  }
}
