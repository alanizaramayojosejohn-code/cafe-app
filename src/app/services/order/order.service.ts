import { Injectable, inject } from '@angular/core'
import {
   Firestore,
   collection,
   collectionData,
   doc,
   addDoc,
   updateDoc,
   deleteDoc,
   query,
   where,
   orderBy,
   Timestamp,
} from '@angular/fire/firestore'
import { Observable } from 'rxjs'
import { Order, OrderCreate } from '../../models/order.model'

@Injectable()
export class OrderService {
   private firestore = inject(Firestore)
   private ordersCollection = collection(this.firestore, 'orders')

   getOrders(): Observable<Order[]> {
      const q = query(this.ordersCollection, orderBy('createdAt', 'desc'))
      return collectionData(q, { idField: 'id' }) as Observable<Order[]>
   }

   getOrdersByTable(tableId: string): Observable<Order[]> {
      const q = query(
         this.ordersCollection,
         where('tableId', '==', tableId),
         where('status', 'in', ['pendiente', 'preparando']),
         orderBy('createdAt', 'desc')
      )
      return collectionData(q, { idField: 'id' }) as Observable<Order[]>
   }

   async createOrder(orderData: OrderCreate): Promise<string> {
      const now = Timestamp.now()
      const docRef = await addDoc(this.ordersCollection, {
         ...orderData,
         createdAt: now,
         updatedAt: now,
      })
      return docRef.id
   }

   async updateOrder(id: string, orderData: Partial<Order>): Promise<void> {
      const orderDoc = doc(this.firestore, `orders/${id}`)
      await updateDoc(orderDoc, {
         ...orderData,
         updatedAt: Timestamp.now(),
      })
   }

   async deleteOrder(id: string): Promise<void> {
      const orderDoc = doc(this.firestore, `orders/${id}`)
      await deleteDoc(orderDoc)
   }
}
