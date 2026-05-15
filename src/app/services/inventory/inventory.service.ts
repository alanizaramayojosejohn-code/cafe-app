import { Injectable, inject } from '@angular/core'
import {
   Firestore,
   doc,
   runTransaction,
   Timestamp,
   Transaction,
} from '@angular/fire/firestore'
import { OrderItem } from '../../models/order.model'
import { Product } from '../../models/product.model'

export interface StockDelta {
   productId: string
   /** Positivo descuenta stock; negativo lo restaura. */
   delta: number
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
   private firestore = inject(Firestore)

   /**
    * Aplica deltas de stock dentro de una transacción usando los snapshots de productos
    * que ya cargó el llamador (para no hacer doble lectura cuando ya se está dentro de
    * otra transacción de orden).
    */
   async applyStockDeltas(deltas: StockDelta[]): Promise<void> {
      const tracked = deltas.filter((d) => d.delta !== 0)
      if (tracked.length === 0) return

      await runTransaction(this.firestore, async (tx) => {
         await this.applyDeltasInTransaction(tx, tracked)
      })
   }

   /**
    * Versión usable dentro de una transacción ya abierta.
    * Hace todas las lecturas primero (regla de Firestore: reads antes que writes),
    * valida stock suficiente y luego escribe.
    */
   async applyDeltasInTransaction(tx: Transaction, deltas: StockDelta[]): Promise<void> {
      if (deltas.length === 0) return

      const reads = await Promise.all(
         deltas.map(async (d) => {
            const ref = doc(this.firestore, `products/${d.productId}`)
            const snap = await tx.get(ref)
            return { ref, snap, delta: d }
         })
      )

      for (const { snap, delta } of reads) {
         if (!snap.exists()) continue
         const product = snap.data() as Product
         if (product.type !== 'nocomestible') continue
         if (product.stock === undefined || product.stock === null) continue

         const newStock = product.stock - delta.delta
         if (newStock < 0) {
            throw new Error(
               `Stock insuficiente de "${product.name}". Disponible: ${product.stock}, requerido: ${delta.delta}.`
            )
         }
      }

      for (const { ref, snap, delta } of reads) {
         if (!snap.exists()) continue
         const product = snap.data() as Product
         if (product.type !== 'nocomestible') continue
         if (product.stock === undefined || product.stock === null) continue

         tx.update(ref, {
            stock: product.stock - delta.delta,
            updatedAt: Timestamp.now(),
         })
      }
   }

   /** Atajo: convierte items de orden a deltas (positivo = descontar). */
   itemsToDeltas(items: OrderItem[]): StockDelta[] {
      return items
         .filter((i) => i.product?.type === 'nocomestible')
         .map((i) => ({ productId: i.productId, delta: i.quantity }))
   }

   /**
    * Calcula el delta entre items previos y nuevos (positivo = descontar más).
    * Útil para edición de venta.
    */
   diffItems(previous: OrderItem[], next: OrderItem[]): StockDelta[] {
      const prevMap = new Map<string, { qty: number; type?: string }>()
      for (const item of previous) {
         prevMap.set(item.productId, {
            qty: item.quantity,
            type: item.product?.type,
         })
      }

      const nextMap = new Map<string, { qty: number; type?: string }>()
      for (const item of next) {
         nextMap.set(item.productId, {
            qty: item.quantity,
            type: item.product?.type,
         })
      }

      const ids = new Set([...prevMap.keys(), ...nextMap.keys()])
      const deltas: StockDelta[] = []

      for (const id of ids) {
         const prev = prevMap.get(id)
         const next = nextMap.get(id)
         const type = next?.type ?? prev?.type
         if (type !== 'nocomestible') continue

         const prevQty = prev?.qty ?? 0
         const nextQty = next?.qty ?? 0
         const delta = nextQty - prevQty
         if (delta !== 0) deltas.push({ productId: id, delta })
      }

      return deltas
   }

   async manualSetStock(productId: string, newStock: number): Promise<void> {
      if (newStock < 0) throw new Error('El stock no puede ser negativo')
      const ref = doc(this.firestore, `products/${productId}`)
      await runTransaction(this.firestore, async (tx) => {
         const snap = await tx.get(ref)
         if (!snap.exists()) throw new Error('Producto no encontrado')
         const product = snap.data() as Product
         if (product.type !== 'nocomestible') {
            throw new Error('Solo se puede setear stock a productos no comestibles')
         }
         tx.update(ref, { stock: newStock, updatedAt: Timestamp.now() })
      })
   }
}
