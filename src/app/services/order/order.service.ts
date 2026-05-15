import { Injectable, inject } from '@angular/core'
import {
   Firestore,
   collection,
   collectionData,
   docData,
   doc,
   updateDoc,
   deleteDoc,
   runTransaction,
   query,
   where,
   orderBy,
   Timestamp,
} from '@angular/fire/firestore'
import { Observable } from 'rxjs'
import { Order, OrderCreate, OrderItem } from '../../models/order.model'
import { InventoryService } from '../inventory/inventory.service'

@Injectable()
export class OrderService {
   private firestore = inject(Firestore)
   private inventory = inject(InventoryService)
   private ordersCollection = collection(this.firestore, 'orders')

   getOrders(): Observable<Order[]> {
      const q = query(this.ordersCollection, orderBy('createdAt', 'desc'))
      return collectionData(q, { idField: 'id' }) as Observable<Order[]>
   }

   getOrdersByDay(date: Date = new Date()): Observable<Order[]> {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)

      const q = query(
         this.ordersCollection,
         where('createdAt', '>=', Timestamp.fromDate(start)),
         where('createdAt', '<', Timestamp.fromDate(end)),
         orderBy('createdAt', 'desc')
      )
      return collectionData(q, { idField: 'id' }) as Observable<Order[]>
   }

   getOrderById(id: string): Observable<Order | undefined> {
      const ref = doc(this.firestore, `orders/${id}`)
      return docData(ref, { idField: 'id' }) as Observable<Order | undefined>
   }

   getOrdersByTable(tableId: string): Observable<Order[]> {
      const q = query(
         this.ordersCollection,
         where('tableId', '==', tableId),
         where('status', 'in', ['pendiente', 'preparando', 'lista']),
         orderBy('createdAt', 'desc')
      )
      return collectionData(q, { idField: 'id' }) as Observable<Order[]>
   }

   getKitchenOrders(): Observable<Order[]> {
      const q = query(
         this.ordersCollection,
         where('status', '==', 'pendiente'),
         orderBy('createdAt', 'asc')
      )
      return collectionData(q, { idField: 'id' }) as Observable<Order[]>
   }

   async markReady(id: string): Promise<void> {
      await this.updateOrder(id, { status: 'lista' })
   }

   async markDelivered(id: string): Promise<void> {
      await this.updateOrder(id, { status: 'entregado' })
   }

   async cancelOrder(id: string): Promise<void> {
      const orderRef = doc(this.firestore, `orders/${id}`)
      await runTransaction(this.firestore, async (tx) => {
         const snap = await tx.get(orderRef)
         if (!snap.exists()) throw new Error('Venta no encontrada')
         const order = snap.data() as Order
         if (order.status === 'cancelado') return

         // Restauramos stock: invertimos el signo del delta original.
         const restoreDeltas = this.inventory
            .itemsToDeltas(order.items)
            .map((d) => ({ ...d, delta: -d.delta }))

         await this.inventory.applyDeltasInTransaction(tx, restoreDeltas)
         tx.update(orderRef, {
            status: 'cancelado',
            updatedAt: Timestamp.now(),
         })
      })
   }

   async createOrder(orderData: OrderCreate): Promise<string> {
      const now = Timestamp.now()
      const orderRef = doc(this.ordersCollection)
      const deltas = this.inventory.itemsToDeltas(orderData.items)

      await runTransaction(this.firestore, async (tx) => {
         await this.inventory.applyDeltasInTransaction(tx, deltas)
         tx.set(orderRef, {
            ...orderData,
            createdAt: now,
            updatedAt: now,
         })
      })

      return orderRef.id
   }

   async updateOrder(id: string, orderData: Partial<Order>): Promise<void> {
      const orderDoc = doc(this.firestore, `orders/${id}`)
      await updateDoc(orderDoc, {
         ...orderData,
         updatedAt: Timestamp.now(),
      })
   }

   /**
    * Edición de venta: ajusta el stock por la diferencia entre items previos y nuevos
    * y persiste el resto del payload en la misma transacción.
    */
   async updateOrderItems(
      id: string,
      previousItems: OrderItem[],
      payload: Partial<Order> & { items: OrderItem[] }
   ): Promise<void> {
      const orderRef = doc(this.firestore, `orders/${id}`)
      const deltas = this.inventory.diffItems(previousItems, payload.items)

      await runTransaction(this.firestore, async (tx) => {
         await this.inventory.applyDeltasInTransaction(tx, deltas)
         tx.update(orderRef, {
            ...payload,
            updatedAt: Timestamp.now(),
         })
      })
   }

   async deleteOrder(id: string): Promise<void> {
      const orderDoc = doc(this.firestore, `orders/${id}`)
      await deleteDoc(orderDoc)
   }
}
