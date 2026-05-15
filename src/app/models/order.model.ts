import { Timestamp } from '@angular/fire/firestore'
import { Product } from './product.model'

export type OrderStatus = 'pendiente' | 'preparando' | 'lista' | 'entregado' | 'cancelado'
export type PaymentMethod = 'efectivo' | 'qr'

export interface OrderItem {
   productId: string
   product: Product
   quantity: number
   price: number
   subtotal: number
}

export interface Order {
   id: string
   tableId: string
   tableName: string
   items: OrderItem[]
   subtotal: number
   // tax: number;
   total: number
   status: OrderStatus
   createdAt: Timestamp
   updatedAt: Timestamp
   userId?: string
   /** Método de pago. Solo presente cuando status === 'entregado'. */
   paymentMethod?: PaymentMethod
}

export interface OrderCreate extends Omit<Order, 'id' | 'createdAt' | 'updatedAt'> {}
