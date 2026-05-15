import { Injectable, inject } from '@angular/core'
import {
   Firestore,
   collection,
   collectionData,
   addDoc,
   doc,
   updateDoc,
   deleteDoc,
   query,
   where,
   orderBy,
   Timestamp,
} from '@angular/fire/firestore'
import { Observable, map } from 'rxjs'
import { InventoryNote, InventoryNoteCreate } from '../../models/inventory-note.model'

@Injectable({ providedIn: 'root' })
export class InventoryNoteService {
   private firestore = inject(Firestore)
   private notesCollection = collection(this.firestore, 'inventoryNotes')

   getAll(): Observable<InventoryNote[]> {
      const q = query(this.notesCollection, orderBy('createdAt', 'desc'))
      return collectionData(q, { idField: 'id' }) as Observable<InventoryNote[]>
   }

   getPending(): Observable<InventoryNote[]> {
      const q = query(
         this.notesCollection,
         where('resolved', '==', false),
         orderBy('createdAt', 'desc')
      )
      return collectionData(q, { idField: 'id' }) as Observable<InventoryNote[]>
   }

   getPendingCount(): Observable<number> {
      return this.getPending().pipe(map((notes) => notes.length))
   }

   async create(data: InventoryNoteCreate): Promise<string> {
      const text = data.text.trim()
      if (!text) throw new Error('La nota no puede estar vacía')
      const ref = await addDoc(this.notesCollection, {
         text,
         createdBy: data.createdBy,
         createdByName: data.createdByName,
         createdAt: Timestamp.now(),
         resolved: false,
      })
      return ref.id
   }

   async resolve(id: string, resolvedBy: string): Promise<void> {
      const ref = doc(this.firestore, `inventoryNotes/${id}`)
      await updateDoc(ref, {
         resolved: true,
         resolvedAt: Timestamp.now(),
         resolvedBy,
      })
   }

   async reopen(id: string): Promise<void> {
      const ref = doc(this.firestore, `inventoryNotes/${id}`)
      await updateDoc(ref, {
         resolved: false,
         resolvedAt: null,
         resolvedBy: null,
      })
   }

   async delete(id: string): Promise<void> {
      await deleteDoc(doc(this.firestore, `inventoryNotes/${id}`))
   }
}
