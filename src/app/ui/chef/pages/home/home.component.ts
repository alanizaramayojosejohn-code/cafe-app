import { Component, computed, inject, signal } from '@angular/core'
import { DatePipe } from '@angular/common'
import { toSignal } from '@angular/core/rxjs-interop'
import { timer, map } from 'rxjs'
import { OrderService } from '../../../../services/order/order.service'
import { Order } from '../../../../models/order.model'

@Component({
   selector: 'app-chef-home',
   standalone: true,
   imports: [DatePipe],
   providers: [OrderService],
   templateUrl: './home.component.html',
})
export default class ChefHome {
   private orderService = inject(OrderService)

   orders = toSignal(this.orderService.getKitchenOrders(), { initialValue: [] as Order[] })

   // Reloj que tick-tack cada 30s para que los minutos transcurridos se actualicen.
   private ticker = toSignal(timer(0, 30_000).pipe(map(() => new Date())), {
      initialValue: new Date(),
   })

   updatingId = signal<string | null>(null)

   now = computed(() => this.ticker())
   clock = computed(() => {
      const d = this.now()
      return `${d.getHours().toString().padStart(2, '0')}:${d
         .getMinutes()
         .toString()
         .padStart(2, '0')}`
   })

   async markReady(order: Order) {
      if (this.updatingId()) return
      this.updatingId.set(order.id)
      try {
         await this.orderService.markReady(order.id)
      } catch (error) {
         console.error('Error al marcar lista:', error)
         alert('No se pudo marcar la orden como lista')
      } finally {
         this.updatingId.set(null)
      }
   }

   totalItems(order: Order): number {
      return order.items.reduce((sum, item) => sum + item.quantity, 0)
   }

   minutesAgo(order: Order): number {
      const d = order.createdAt?.toDate?.()
      if (!d) return 0
      return Math.max(0, Math.floor((this.now().getTime() - d.getTime()) / 60000))
   }

   urgency(order: Order): 'new' | 'ok' | 'warn' | 'late' {
      const m = this.minutesAgo(order)
      if (m <= 1) return 'new'
      if (m < 5) return 'ok'
      if (m < 10) return 'warn'
      return 'late'
   }
}
