import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, query, where } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Observable } from 'rxjs';
import { Product } from '../../models/product.model';
import { docData } from '@angular/fire/firestore';
@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  private productsCollection = collection(this.firestore, 'products');

  getProducts(): Observable<Product[]> {
    return collectionData(this.productsCollection, { idField: 'id' }) as Observable<Product[]>;
  }

  getProductsByCategory(categoryId: string): Observable<Product[]> {
    const q = query(this.productsCollection, where('categoryId', '==', categoryId));
    return collectionData(q, { idField: 'id' }) as Observable<Product[]>;
  }

  async addProduct(product: Omit<Product, 'createdAt' | 'updatedAt' | 'imageUrl' | 'imagePath'

    | 'recipeUrl' | 'recipePath'>, imageFile?: File, recipeFile?: File) {
    let imageUrl = '';
    let imagePath = '';
    let recipeUrl = '';
    let recipePath = '';

    if (imageFile) {
      imagePath = `products/${Date.now()}_${imageFile.name}`;
      const imageRef = ref(this.storage, imagePath);
      await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(imageRef);
    }

    if (recipeFile) {
      recipePath = `recipes/${Date.now()}_${recipeFile.name}`;
      const recipeRef = ref(this.storage, recipePath);
      await uploadBytes(recipeRef, recipeFile);
      recipeUrl = await getDownloadURL(recipeRef);
    }

    return addDoc(this.productsCollection, {
      ...product,
      imageUrl,
      imagePath,
      recipeUrl,
      recipePath,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

  }
 getProductById(id: string): Observable<Product | undefined> {
  const productDoc = doc(this.firestore, 'products', id);
  return docData(productDoc, { idField: 'id' }) as Observable<Product | undefined>;
}
  async updateProduct(id: string, product: Partial<Product>, imageFile?: File, recipeFile?: File) {
    const productDoc = doc(this.firestore, 'products', id);
    const updates: any = { ...product, updatedAt: serverTimestamp() };

    if (imageFile) {
      if (product.imagePath) {
        const oldImageRef = ref(this.storage, product.imagePath);
        await deleteObject(oldImageRef).catch(() => {});
      }

      updates.imagePath = `products/${Date.now()}_${imageFile.name}`;
      const imageRef = ref(this.storage, updates.imagePath);
      await uploadBytes(imageRef, imageFile);
      updates.imageUrl = await getDownloadURL(imageRef);
    }

    if (recipeFile) {
      if (product.recipePath) {
        const oldRecipeRef = ref(this.storage, product.recipePath);
        await deleteObject(oldRecipeRef).catch(() => {});
      }

      updates.recipePath = `recipes/${Date.now()}_${recipeFile.name}`;
      const recipeRef = ref(this.storage, updates.recipePath);
      await uploadBytes(recipeRef, recipeFile);
      updates.recipeUrl = await getDownloadURL(recipeRef);
    }

    return updateDoc(productDoc, updates);
  }

  async deleteProduct(id: string, imagePath?: string, recipePath?: string) {
    if (imagePath) {
      const imageRef = ref(this.storage, imagePath);
      await deleteObject(imageRef).catch(() => {});
    }

    if (recipePath) {
      const recipeRef = ref(this.storage, recipePath);
      await deleteObject(recipeRef).catch(() => {});
    }

    const productDoc = doc(this.firestore, 'products', id);
    return deleteDoc(productDoc);
  }
}
