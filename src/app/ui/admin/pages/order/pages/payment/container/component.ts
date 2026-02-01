import { Component, inject, signal, computed, OnInit } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { AsyncPipe, DatePipe } from '@angular/common'
import { OrderService } from '../../../../../../../services/order/order.service'
import { Order } from '../../../../../../../models/order.model'
import { Observable, map } from 'rxjs'
import { ProductService } from '../../../../../../../services/product/product.service'
import { TableService } from '../../../../../../../services/order/table.service'
import { CategoryService } from '../../../../../../../services/category/category.service'
import { FileValidationService } from '../../../../../../../services/product/validation.service'
import { ImageCompressionService } from '../../../../../../../services/product/compression.service'
import { StorageService } from '../../../../../../../services/storage/storage.service'
import { ProductRepositoryService } from '../../../../../../../services/product/product-repository.service'
@Component({
   selector: 'app-order-payment',
   imports: [FormsModule, AsyncPipe, DatePipe],
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
export default class OrderPaymentComponent implements OnInit {
   private orderService = inject(OrderService)
   private router = inject(Router)
   private route = inject(ActivatedRoute)

   saving = signal(false)

   order$!: Observable<Order | undefined>
   orderId = signal<string>('')

   paymentMethod = signal<'Efectivo' | 'Qr'>('Efectivo')

   nit = signal<string>('')
   amountPaid = signal<number>(0)

   change = computed(() => {
      const order = this.currentOrder()
      if (!order) return 0
      return Math.max(0, this.amountPaid() - order.total)
   })

   currentOrder = signal<Order | undefined>(undefined)

   ngOnInit() {
      const id = this.route.snapshot.paramMap.get('id')
      if (id) {
         this.orderId.set(id)
         this.loadOrder(id)
      }
   }

   loadOrder(id: string) {
      this.order$ = this.orderService.getOrders().pipe(map((orders) => orders.find((o) => o.id === id)))

      this.order$.subscribe((order) => {
         this.currentOrder.set(order)
         if (order) {
            this.amountPaid.set(order.total)
         }
      })
   }

   selectPaymentMethod(method: 'Efectivo' | 'Qr') {
      this.paymentMethod.set(method)
   }

   async processPayment() {
      const order = this.currentOrder()
      if (!order) {
         alert('No se encontró la orden')
         return
      }

      if (this.paymentMethod() === 'Efectivo' && this.amountPaid() < order.total) {
         alert('El monto pagado es insuficiente')
         return
      }

      this.saving.set(true)

      try {
         await this.orderService.updateOrder(order.id, {
            status: 'entregado',
         })

         alert('Pago procesado exitosamente')
         this.router.navigate(['../..'], { relativeTo: this.route })
      } catch (error) {
         console.error('Error al procesar el pago:', error)
         alert('Error al procesar el pago')
      } finally {
         this.saving.set(false)
      }
   }

   goBack() {
      this.router.navigate(['../..'], { relativeTo: this.route })
   }

   updateAmountPaid(value: string) {
      const num = parseFloat(value) || 0
      this.amountPaid.set(num)
   }
}
