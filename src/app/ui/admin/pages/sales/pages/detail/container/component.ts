import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core'
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

@Component({
   selector: 'app-sales-detail',
   imports: [CurrencyPipe, DatePipe],
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
export default class SalesDetailComponent implements OnInit, OnDestroy {
   private orderService = inject(OrderService)
   private userService = inject(UserService)
   private route = inject(ActivatedRoute)
   private router = inject(Router)

   order = signal<Order | undefined>(undefined)
   loading = signal(true)
   notFound = signal(false)
   cashierName = signal<string>('')
   working = signal(false)

   private sub?: Subscription

   ngOnInit() {
      const id = this.route.snapshot.paramMap.get('id')
      if (!id) {
         this.notFound.set(true)
         this.loading.set(false)
         return
      }
      this.sub = this.orderService.getOrderById(id).subscribe(async (order) => {
         this.loading.set(false)
         if (!order) {
            this.notFound.set(true)
            return
         }
         this.order.set(order)
         if (order.userId && !this.cashierName()) {
            try {
               const user = await this.userService.getUserByUid(order.userId)
               this.cashierName.set(user?.displayName ?? user?.email ?? order.userId)
            } catch {
               this.cashierName.set(order.userId)
            }
         }
      })
   }

   ngOnDestroy() {
      this.sub?.unsubscribe()
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
            return 'bg-warning text-white'
         case 'preparando':
            return 'bg-ink-primary text-white'
         case 'lista':
            return 'bg-success text-white'
         case 'entregado':
            return 'bg-surface-2 text-ink-primary'
         case 'cancelado':
            return 'bg-danger text-white'
      }
   }

   volver() {
      this.router.navigate(['..'], { relativeTo: this.route })
   }

   editar() {
      const o = this.order()
      if (!o) return
      this.router.navigate(['editar'], { relativeTo: this.route })
   }

   async cancelar() {
      const o = this.order()
      if (!o) return
      if (!confirm(`¿Cancelar la venta de ${o.tableName}?`)) return
      this.working.set(true)
      try {
         await this.orderService.cancelOrder(o.id)
      } catch (error) {
         console.error('Error al cancelar la venta:', error)
         alert('Error al cancelar la venta')
      } finally {
         this.working.set(false)
      }
   }

   cobrar() {
      const o = this.order()
      if (!o) return
      const base = this.router.url.startsWith('/caja') ? '/caja' : '/admin'
      this.router.navigate([base, 'ordenes', o.id, 'payment'])
   }
}
