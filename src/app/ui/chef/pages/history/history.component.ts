import { Component, inject } from '@angular/core'
import { DatePipe } from '@angular/common'
import { toSignal } from '@angular/core/rxjs-interop'
import { map } from 'rxjs'
import { OrderService } from '../../../../services/order/order.service'
import { Order } from '../../../../models/order.model'

@Component({
   selector: 'app-chef-history',
   standalone: true,
   imports: [DatePipe],
   providers: [OrderService],
   templateUrl: './history.component.html',
})
export default class ChefHistory {
   private orderService = inject(OrderService)

   orders = toSignal(
      this.orderService
         .getOrdersByDay()
         .pipe(
            map((all) => all.filter((o) => o.status === 'lista' || o.status === 'entregado'))
         ),
      { initialValue: [] as Order[] }
   )

   totalItems(order: Order): number {
      return order.items.reduce((sum, i) => sum + i.quantity, 0)
   }
}
