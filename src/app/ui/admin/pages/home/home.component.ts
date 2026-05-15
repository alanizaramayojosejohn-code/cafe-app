import { Component, computed, inject, signal } from '@angular/core'
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common'
import { RouterLink } from '@angular/router'
import { toSignal } from '@angular/core/rxjs-interop'
import { ReportService, PaymentBreakdownEntry } from '../../../../services/report/report.service'
import { ProductRepositoryService } from '../../../../services/product/product-repository.service'
import { OrderService } from '../../../../services/order/order.service'
import { AuthService } from '../../../../services/auth/auth.service'
import { Product } from '../../../../models/product.model'
import { Order, PaymentMethod } from '../../../../models/order.model'

const LOW_STOCK_THRESHOLD = 5
const BAR_MAX_HEIGHT = 200

const DONUT_RADIUS = 70
const DONUT_STROKE = 24
const DONUT_CIRC = 2 * Math.PI * DONUT_RADIUS

interface DonutSlice {
   method: PaymentMethod | 'sin_metodo'
   label: string
   total: number
   count: number
   color: string
   /** Largo del arco visible (stroke-dasharray) */
   length: number
   /** Offset acumulado (stroke-dashoffset, signo negativo para girar a la derecha) */
   offset: number
}

interface DayPoint {
   /** YYYY-MM-DD en hora local */
   date: string
   count: number
   total: number
}

interface TopRow {
   productId: string
   name: string
   quantity: number
   total: number
}

interface StockRow {
   id: string
   name: string
   stock: number
}

@Component({
   selector: 'app-home',
   standalone: true,
   providers: [ProductRepositoryService, OrderService],
   imports: [CommonModule, CurrencyPipe, DatePipe, DecimalPipe, RouterLink],
   templateUrl: './home.component.html',
})
export default class Home {
   private reportService = inject(ReportService)
   private productRepo = inject(ProductRepositoryService)
   private orderService = inject(OrderService)
   private authService = inject(AuthService)

   // Rango amplio: desde inicio del mes (o 7 días atrás) hasta mañana 00:00.
   private now = new Date()
   private monthStart = new Date(this.now.getFullYear(), this.now.getMonth(), 1)
   private sevenAgo = addDays(startOfDay(this.now), -6)
   private queryStart = this.monthStart < this.sevenAgo ? this.monthStart : this.sevenAgo
   private queryEnd = addDays(startOfDay(this.now), 1)

   today = signal(new Date())

   deliveredOrders = toSignal<Order[] | undefined>(
      this.reportService.getDeliveredOrders(this.queryStart, this.queryEnd),
      { initialValue: undefined }
   )

   todayOrdersAll = toSignal<Order[] | undefined>(this.orderService.getOrdersByDay(this.today()), {
      initialValue: undefined,
   })

   products = toSignal<Product[] | undefined>(this.productRepo.getAll(), { initialValue: undefined })

   user = toSignal(this.authService.user$, { initialValue: null })

   todayStart = startOfDay(this.now)
   weekStart = startOfWeek(this.now)
   last7Start = this.sevenAgo

   // Stats entregadas
   todayOrders = computed(() => filterFrom(this.deliveredOrders() ?? [], this.todayStart))
   weekOrders = computed(() => filterFrom(this.deliveredOrders() ?? [], this.weekStart))
   monthOrders = computed(() => filterFrom(this.deliveredOrders() ?? [], this.monthStart))

   todaySummary = computed(() => this.reportService.summary(this.todayOrders()))
   weekSummary = computed(() => this.reportService.summary(this.weekOrders()))
   monthSummary = computed(() => this.reportService.summary(this.monthOrders()))

   // Ops strip — todas las órdenes de hoy (cualquier status)
   listasCount = computed(
      () => (this.todayOrdersAll() ?? []).filter((o) => o.status === 'lista').length
   )
   preparandoCount = computed(
      () =>
         (this.todayOrdersAll() ?? []).filter(
            (o) => o.status === 'pendiente' || o.status === 'preparando'
         ).length
   )
   entregadasCount = computed(
      () => (this.todayOrdersAll() ?? []).filter((o) => o.status === 'entregado').length
   )
   canceladasCount = computed(
      () => (this.todayOrdersAll() ?? []).filter((o) => o.status === 'cancelado').length
   )

   // Órdenes activas FIFO (listas arriba, luego por tiempo)
   activeOrders = computed<Order[]>(() => {
      const all = this.todayOrdersAll() ?? []
      return all
         .filter((o) => o.status === 'lista' || o.status === 'preparando' || o.status === 'pendiente')
         .sort((a, b) => {
            const sa = a.status === 'lista' ? 0 : 1
            const sb = b.status === 'lista' ? 0 : 1
            if (sa !== sb) return sa - sb
            const ta = a.createdAt?.toMillis?.() ?? 0
            const tb = b.createdAt?.toMillis?.() ?? 0
            return ta - tb
         })
         .slice(0, 4)
   })

   recentActivity = computed<Order[]>(() => {
      const all = this.todayOrdersAll() ?? []
      return all
         .filter((o) => o.status === 'entregado')
         .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
         .slice(0, 4)
   })

   // Chart
   last7Days = computed<DayPoint[]>(() => {
      const start = this.last7Start
      const end = this.queryEnd
      const orders = filterFrom(this.deliveredOrders() ?? [], start)
      return this.reportService.byDay(orders, start, end) as DayPoint[]
   })

   maxDayTotal = computed(() => {
      const max = Math.max(0, ...this.last7Days().map((d) => d.total))
      return max || 1
   })

   last7Total = computed(() => this.last7Days().reduce((a, b) => a + b.total, 0))

   topProducts = computed<TopRow[]>(
      () => this.reportService.topProducts(this.monthOrders(), 5) as TopRow[]
   )

   // Stock
   trackedProducts = computed<Product[]>(() =>
      (this.products() ?? []).filter(
         (p) => p.type === 'nocomestible' && typeof p.stock === 'number'
      )
   )

   outOfStock = computed(() => this.trackedProducts().filter((p) => (p.stock ?? 0) <= 0))

   lowStock = computed(() =>
      this.trackedProducts().filter(
         (p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= LOW_STOCK_THRESHOLD
      )
   )

   stockAlertsTotal = computed(() => this.outOfStock().length + this.lowStock().length)

   stockAlertsList = computed<StockRow[]>(() => {
      const combined = [...this.outOfStock(), ...this.lowStock()]
      return combined
         .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
         .slice(0, 5)
         .map((p) => ({ id: p.id ?? '', name: p.name, stock: p.stock ?? 0 }))
   })

   loadingSales = computed(() => this.deliveredOrders() === undefined)
   loadingStock = computed(() => this.products() === undefined)

   lowStockThreshold = LOW_STOCK_THRESHOLD
   barMaxHeight = BAR_MAX_HEIGHT

   // Donut: distribución de métodos de pago en el mes (solo entregadas)
   paymentBreakdown = computed<PaymentBreakdownEntry[]>(() =>
      this.reportService.byPaymentMethod(this.monthOrders())
   )

   donutSlices = computed<DonutSlice[]>(() => {
      const entries = this.paymentBreakdown()
      const totalAll = entries.reduce((s, e) => s + e.total, 0)
      if (totalAll <= 0) return []
      let acc = 0
      return entries
         .filter((e) => e.total > 0)
         .map((e) => {
            const fraction = e.total / totalAll
            const length = fraction * DONUT_CIRC
            const offset = -acc
            acc += length
            return {
               method: e.method,
               label: e.label,
               total: e.total,
               count: e.count,
               color: this.colorFor(e.method),
               length,
               offset,
            }
         })
   })

   donutTotal = computed(() => this.paymentBreakdown().reduce((s, e) => s + e.total, 0))

   donutCircumference = DONUT_CIRC
   donutRadius = DONUT_RADIUS
   donutStroke = DONUT_STROKE

   private colorFor(method: PaymentMethod | 'sin_metodo'): string {
      switch (method) {
         case 'efectivo':
            return 'var(--success)'
         case 'qr':
            return 'var(--brand-500)'
         case 'sin_metodo':
            return 'var(--text-tertiary)'
      }
   }

   barHeight(value: number): number {
      const max = this.maxDayTotal()
      if (max <= 0) return 0
      return Math.max(4, Math.round((value / max) * this.barMaxHeight))
   }

   isMaxDay(value: number): boolean {
      return value > 0 && value === this.maxDayTotal()
   }

   dayLabel(iso: string): string {
      // iso = 'YYYY-MM-DD' hora local
      const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10))
      const dt = new Date(y, m - 1, d)
      return ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][dt.getDay()]
   }

   minutesAgo(order: Order): number {
      const d = order.createdAt?.toDate?.()
      if (!d) return 0
      return Math.max(0, Math.floor((this.now.getTime() - d.getTime()) / 60000))
   }

   greeting(): string {
      const h = this.now.getHours()
      if (h < 12) return 'Buenos días'
      if (h < 19) return 'Buenas tardes'
      return 'Buenas noches'
   }

   userName(): string {
      const u = this.user()
      if (!u) return ''
      return (u.displayName ?? u.email?.split('@')[0] ?? '').split(' ')[0]
   }
}

function startOfDay(d: Date): Date {
   const x = new Date(d)
   x.setHours(0, 0, 0, 0)
   return x
}

function addDays(d: Date, n: number): Date {
   const x = new Date(d)
   x.setDate(x.getDate() + n)
   return x
}

function startOfWeek(d: Date): Date {
   const x = startOfDay(d)
   const day = x.getDay()
   const offset = day === 0 ? 6 : day - 1
   x.setDate(x.getDate() - offset)
   return x
}

function filterFrom(orders: Order[], from: Date): Order[] {
   const ts = from.getTime()
   return orders.filter((o) => {
      const d = o.createdAt?.toDate?.()
      return d ? d.getTime() >= ts : false
   })
}
