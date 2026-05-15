import { Injectable, inject } from '@angular/core'
import {
   Firestore,
   collection,
   collectionData,
   query,
   where,
   orderBy,
   Timestamp,
} from '@angular/fire/firestore'
import { Observable } from 'rxjs'
import { Order, PaymentMethod } from '../../models/order.model'

export interface SalesSummary {
   total: number
   count: number
   average: number
   /** Costo total agregado de los items (sumando cost × quantity). 0 si ningún producto tiene cost. */
   cost: number
   /** Ganancia bruta = total − cost. */
   profit: number
   /** Margen = profit / total (0–1). 0 si total es 0. */
   margin: number
}

export interface DailyPoint {
   /** YYYY-MM-DD en hora local */
   date: string
   total: number
   count: number
   cost: number
   profit: number
}

export interface TopProduct {
   productId: string
   name: string
   quantity: number
   total: number
}

export interface PaymentBreakdownEntry {
   method: PaymentMethod | 'sin_metodo'
   label: string
   count: number
   total: number
}

@Injectable({ providedIn: 'root' })
export class ReportService {
   private firestore = inject(Firestore)
   private ordersCollection = collection(this.firestore, 'orders')

   /**
    * Órdenes entregadas en [start, end). Excluye cancelado y estados abiertos.
    * El rango `end` es exclusivo — si seleccionas "hoy", pasa mañana 00:00.
    */
   getDeliveredOrders(start: Date, end: Date): Observable<Order[]> {
      const q = query(
         this.ordersCollection,
         where('status', '==', 'entregado'),
         where('createdAt', '>=', Timestamp.fromDate(start)),
         where('createdAt', '<', Timestamp.fromDate(end)),
         orderBy('createdAt', 'asc')
      )
      return collectionData(q, { idField: 'id' }) as Observable<Order[]>
   }

   summary(orders: Order[]): SalesSummary {
      const total = orders.reduce((s, o) => s + (o.total || 0), 0)
      const count = orders.length
      const average = count > 0 ? total / count : 0
      const cost = orders.reduce((s, o) => s + this.orderCost(o), 0)
      const profit = total - cost
      const margin = total > 0 ? profit / total : 0
      return { total, count, average, cost, profit, margin }
   }

   /**
    * Agrupa por día local. Devuelve todos los días del rango inclusive
    * (aunque no haya ventas) para que el detalle no tenga huecos.
    */
   byDay(orders: Order[], start: Date, end: Date): DailyPoint[] {
      const buckets = new Map<string, DailyPoint>()

      const cursor = new Date(start)
      cursor.setHours(0, 0, 0, 0)
      const last = new Date(end)
      last.setHours(0, 0, 0, 0)
      while (cursor < last) {
         const key = this.dateKey(cursor)
         buckets.set(key, { date: key, total: 0, count: 0, cost: 0, profit: 0 })
         cursor.setDate(cursor.getDate() + 1)
      }

      for (const o of orders) {
         const d = o.createdAt?.toDate?.()
         if (!d) continue
         const key = this.dateKey(d)
         const point = buckets.get(key) ?? { date: key, total: 0, count: 0, cost: 0, profit: 0 }
         const orderTotal = o.total || 0
         const orderCost = this.orderCost(o)
         point.total += orderTotal
         point.count += 1
         point.cost += orderCost
         point.profit += orderTotal - orderCost
         buckets.set(key, point)
      }

      return Array.from(buckets.values()).sort((a, b) => a.date.localeCompare(b.date))
   }

   topProducts(orders: Order[], limit = 10): TopProduct[] {
      const map = new Map<string, TopProduct>()
      for (const o of orders) {
         for (const item of o.items || []) {
            const key = item.productId
            const prev = map.get(key) ?? {
               productId: key,
               name: item.product?.name ?? '(sin nombre)',
               quantity: 0,
               total: 0,
            }
            prev.quantity += item.quantity || 0
            prev.total += item.subtotal || 0
            map.set(key, prev)
         }
      }
      return Array.from(map.values())
         .sort((a, b) => b.quantity - a.quantity)
         .slice(0, limit)
   }

   /**
    * Agrupa órdenes entregadas por método de pago. Las que no tengan método
    * registrado caen en `sin_metodo` (órdenes históricas previas al campo).
    */
   byPaymentMethod(orders: Order[]): PaymentBreakdownEntry[] {
      const buckets = new Map<PaymentMethod | 'sin_metodo', PaymentBreakdownEntry>()
      for (const o of orders) {
         const method = o.paymentMethod ?? 'sin_metodo'
         const prev = buckets.get(method) ?? {
            method,
            label: this.methodLabel(method),
            count: 0,
            total: 0,
         }
         prev.count += 1
         prev.total += o.total || 0
         buckets.set(method, prev)
      }
      return Array.from(buckets.values()).sort((a, b) => b.total - a.total)
   }

   private orderCost(o: Order): number {
      let sum = 0
      for (const item of o.items || []) {
         const unitCost = item.product?.cost
         if (typeof unitCost === 'number' && unitCost >= 0) {
            sum += unitCost * (item.quantity || 0)
         }
      }
      return sum
   }

   private methodLabel(m: PaymentMethod | 'sin_metodo'): string {
      switch (m) {
         case 'efectivo':
            return 'Efectivo'
         case 'qr':
            return 'QR'
         case 'sin_metodo':
            return 'Sin método'
      }
   }

   private dateKey(d: Date): string {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
   }
}
