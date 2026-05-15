import { Component, inject } from '@angular/core'
import { AsyncPipe } from '@angular/common'
import { RouterLink } from '@angular/router'
import { Observable } from 'rxjs'
import { OrderService } from '../../../../services/order/order.service'
import { Order } from '../../../../models/order.model'

@Component({
   selector: 'app-cashier-home',
   standalone: true,
   imports: [AsyncPipe, RouterLink],
   providers: [OrderService],
   templateUrl: './home.component.html',
})
export default class CashierHome {
   private orderService = inject(OrderService)

   orders$: Observable<Order[]> = this.orderService.getOrders()

   countByStatus(orders: Order[] | null, status: Order['status']): number {
      if (!orders) return 0
      return orders.filter((o) => o.status === status).length
   }
}
