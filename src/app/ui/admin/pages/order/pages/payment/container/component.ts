import { Component, inject, signal, computed, OnInit } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { CurrencyPipe, DatePipe } from '@angular/common'
import { OrderService } from '../../../../../../../services/order/order.service'
import { Order, PaymentMethod } from '../../../../../../../models/order.model'
import { Observable, map } from 'rxjs'

interface MethodOption {
   id: PaymentMethod
   label: string
   icon: string
}

@Component({
   selector: 'app-order-payment',
   imports: [FormsModule, CurrencyPipe, DatePipe],
   providers: [OrderService],
   templateUrl: './component.html',
})
export default class OrderPaymentComponent implements OnInit {
   private orderService = inject(OrderService)
   private router = inject(Router)
   private route = inject(ActivatedRoute)

   saving = signal(false)
   orderId = signal<string>('')
   currentOrder = signal<Order | undefined>(undefined)
   notFound = signal(false)
   paymentMethod = signal<PaymentMethod>('efectivo')
   amountPaid = signal<number>(0)

   methods: MethodOption[] = [
      { id: 'efectivo', label: 'Efectivo', icon: 'payments' },
      { id: 'qr', label: 'QR', icon: 'qr_code_2' },
   ]

   quickAmounts = [200, 300, 500]

   change = computed(() => {
      const order = this.currentOrder()
      if (!order) return 0
      if (this.paymentMethod() !== 'efectivo') return 0
      return Math.max(0, this.amountPaid() - order.total)
   })

   minutesAgo = computed(() => {
      const order = this.currentOrder()
      if (!order) return 0
      const d = order.createdAt?.toDate?.()
      if (!d) return 0
      return Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000))
   })

   canConfirm = computed(() => {
      const order = this.currentOrder()
      if (!order) return false
      if (this.paymentMethod() === 'efectivo') {
         return this.amountPaid() >= order.total
      }
      return true
   })

   ngOnInit() {
      const id = this.route.snapshot.paramMap.get('id')
      if (id) {
         this.orderId.set(id)
         this.loadOrder(id)
      }
   }

   private loadOrder(id: string) {
      const sub = this.orderService
         .getOrders()
         .pipe(map((orders) => orders.find((o) => o.id === id)))
         .subscribe((order) => {
            if (!order) {
               this.notFound.set(true)
               return
            }
            this.currentOrder.set(order)
            if (this.amountPaid() === 0) {
               this.amountPaid.set(order.total)
            }
         })
      // sub leaks intencionalmente hasta destroy; ok para página one-shot
      void sub
   }

   selectMethod(method: PaymentMethod) {
      this.paymentMethod.set(method)
      if (method !== 'efectivo') {
         this.amountPaid.set(this.currentOrder()?.total ?? 0)
      }
   }

   setExact() {
      const t = this.currentOrder()?.total ?? 0
      this.amountPaid.set(t)
   }

   setQuick(amount: number) {
      this.amountPaid.set(amount)
   }

   updateAmountPaid(value: string) {
      const num = parseFloat(value) || 0
      this.amountPaid.set(num)
   }

   clearAmount() {
      this.amountPaid.set(0)
   }

   async processPayment() {
      const order = this.currentOrder()
      if (!order) return
      if (!this.canConfirm()) {
         alert('El monto pagado es insuficiente')
         return
      }

      this.saving.set(true)
      try {
         await this.orderService.updateOrder(order.id, {
            status: 'entregado',
            paymentMethod: this.paymentMethod(),
         })
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
}
