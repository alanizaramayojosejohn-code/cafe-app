import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { CurrencyPipe, DatePipe } from '@angular/common'
import { Subscription } from 'rxjs'
import { OrderService } from '../../../../../../../services/order/order.service'
import { UserService } from '../../../../../../../services/user/user.service'
import { Order, OrderStatus } from '../../../../../../../models/order.model'
import { ProductService } from '../../../../../../../services/product/product.service'
import { TableService } from '../../../../../../../services/order/table.service'
import { CategoryService } from '../../../../../../../services/category/category.service'
import { FileValidationService } from '../../../../../../../services/product/validation.service'
import { ImageCompressionService } from '../../../../../../../services/product/compression.service'
import { StorageService } from '../../../../../../../services/storage/storage.service'
import { ProductRepositoryService } from '../../../../../../../services/product/product-repository.service'

type StatusFilter = 'all' | OrderStatus

@Component({
   selector: 'app-sales-list',
   imports: [DatePipe, CurrencyPipe],
   providers: [
      ProductService,
      TableService,
      OrderService,
      CategoryService,
      FileValidationService,
      ImageCompressionService,
      StorageService,
      ProductRepositoryService,
   ],
   templateUrl: './component.html',
})
export default class SalesListComponent implements OnInit, OnDestroy {
   private orderService = inject(OrderService)
   private userService = inject(UserService)
   private router = inject(Router)
   private route = inject(ActivatedRoute)

   orders = signal<Order[]>([])
   loading = signal(true)
   selectedStatus = signal<StatusFilter>('all')
   cashierNames = signal<Record<string, string>>({})

   private sub?: Subscription
   private requestedUids = new Set<string>()

   filteredOrders = computed(() => {
      const status = this.selectedStatus()
      const orders = this.orders()
      if (status === 'all') return orders
      return orders.filter((o) => o.status === status)
   })

   totals = computed(() => {
      const orders = this.orders()
      const sum = (filter: (o: Order) => boolean) =>
         orders.filter(filter).reduce((acc, o) => acc + (o.total ?? 0), 0)
      return {
         all: orders.length,
         pendientes: orders.filter((o) => o.status === 'pendiente').length,
         listas: orders.filter((o) => o.status === 'lista').length,
         entregadas: orders.filter((o) => o.status === 'entregado').length,
         canceladas: orders.filter((o) => o.status === 'cancelado').length,
         ingresoEntregadas: sum((o) => o.status === 'entregado'),
      }
   })

   ngOnInit() {
      this.sub = this.orderService.getOrdersByDay().subscribe((orders) => {
         this.orders.set(orders)
         this.loading.set(false)
         this.fetchMissingCashiers(orders)
      })
   }

   ngOnDestroy() {
      this.sub?.unsubscribe()
   }

   private async fetchMissingCashiers(orders: Order[]) {
      const uids = Array.from(
         new Set(
            orders
               .map((o) => o.userId)
               .filter((u): u is string => !!u && !this.requestedUids.has(u))
         )
      )
      if (uids.length === 0) return

      uids.forEach((u) => this.requestedUids.add(u))

      const results = await Promise.all(
         uids.map(async (uid) => {
            try {
               const user = await this.userService.getUserByUid(uid)
               return { uid, name: user?.displayName ?? user?.email ?? uid }
            } catch {
               return { uid, name: uid }
            }
         })
      )

      const next = { ...this.cashierNames() }
      for (const r of results) next[r.uid] = r.name
      this.cashierNames.set(next)
   }

   cashierName(uid?: string): string {
      if (!uid) return '—'
      return this.cashierNames()[uid] ?? '…'
   }

   statusLabel(status: OrderStatus): string {
      switch (status) {
         case 'pendiente':
            return 'Pendiente'
         case 'preparando':
            return 'Preparando'
         case 'lista':
            return 'Lista'
         case 'entregado':
            return 'Entregada'
         case 'cancelado':
            return 'Cancelada'
      }
   }

   statusClasses(status: OrderStatus): string {
      switch (status) {
         case 'pendiente':
         case 'preparando':
            return 'bg-warning text-white'
         case 'lista':
            return 'bg-brand-500 text-white'
         case 'entregado':
            return 'bg-success text-white'
         case 'cancelado':
            return 'bg-danger text-white'
      }
   }

   getOrderSummary(order: Order): string {
      const items = order.items.map((item) => `${item.quantity} ${item.product.name}`)
      const summary = items.join(', ')
      if (summary.length > 60) return summary.substring(0, 60) + '…'
      return summary
   }

   setFilter(status: StatusFilter) {
      this.selectedStatus.set(status)
   }

   nuevaVenta() {
      this.router.navigate(['nueva'], { relativeTo: this.route })
   }

   verDetalle(id: string) {
      this.router.navigate([id], { relativeTo: this.route })
   }

   editar(id: string, event: Event) {
      event.stopPropagation()
      this.router.navigate([id, 'editar'], { relativeTo: this.route })
   }

   async cancelar(order: Order, event: Event) {
      event.stopPropagation()
      if (order.status === 'cancelado') return
      if (!confirm(`¿Cancelar la venta de ${order.tableName}?`)) return
      try {
         await this.orderService.cancelOrder(order.id)
      } catch (error) {
         console.error('Error al cancelar la venta:', error)
         alert('Error al cancelar la venta')
      }
   }

   cobrar(id: string, event: Event) {
      event.stopPropagation()
      this.router.navigate(['/', this.cobroBaseSegment(), 'ordenes', id, 'payment'])
   }

   private cobroBaseSegment(): string {
      // Detecta /admin o /caja por la URL actual.
      return this.router.url.startsWith('/caja') ? 'caja' : 'admin'
   }
}
