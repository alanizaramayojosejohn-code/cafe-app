import { Component, computed, inject, signal } from '@angular/core'
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { toSignal, toObservable } from '@angular/core/rxjs-interop'
import { switchMap } from 'rxjs'
import { MatButtonModule } from '@angular/material/button'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatTableModule } from '@angular/material/table'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { provideNativeDateAdapter } from '@angular/material/core'
import { ReportService } from '../../../../../services/report/report.service'

type Preset = 'hoy' | 'semana' | 'mes' | 'custom'

interface Range {
   start: Date
   /** exclusivo */
   end: Date
}

@Component({
   selector: 'x-admin-reports',
   standalone: true,
   providers: [provideNativeDateAdapter()],
   imports: [
      CommonModule,
      FormsModule,
      CurrencyPipe,
      DatePipe,
      DecimalPipe,
      MatButtonModule,
      MatButtonToggleModule,
      MatFormFieldModule,
      MatInputModule,
      MatDatepickerModule,
      MatTableModule,
      MatProgressSpinnerModule,
   ],
   template: `
      <div class="p-6 space-y-6">
         <div class="flex items-center gap-3">
            <span class="material-symbols-rounded text-3xl">insights</span>
            <div>
               <h2 class="text-2xl font-bold">Reportes de ventas</h2>
               <p class="text-sm text-gray-600">Solo ventas entregadas. Las canceladas se excluyen.</p>
            </div>
         </div>

         <div class="bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-4">
            <mat-button-toggle-group
               [value]="preset()"
               (change)="setPreset($event.value)"
               hideSingleSelectionIndicator
            >
               <mat-button-toggle value="hoy">Hoy</mat-button-toggle>
               <mat-button-toggle value="semana">Semana</mat-button-toggle>
               <mat-button-toggle value="mes">Mes</mat-button-toggle>
               <mat-button-toggle value="custom">Rango</mat-button-toggle>
            </mat-button-toggle-group>

            @if (preset() === 'custom') {
               <mat-form-field appearance="outline" class="!w-44">
                  <mat-label>Desde</mat-label>
                  <input matInput [matDatepicker]="fromPicker" [ngModel]="customStart()" (ngModelChange)="setCustomStart($event)" />
                  <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
                  <mat-datepicker #fromPicker></mat-datepicker>
               </mat-form-field>
               <mat-form-field appearance="outline" class="!w-44">
                  <mat-label>Hasta</mat-label>
                  <input matInput [matDatepicker]="toPicker" [ngModel]="customEnd()" (ngModelChange)="setCustomEnd($event)" />
                  <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
                  <mat-datepicker #toPicker></mat-datepicker>
               </mat-form-field>
            }

            <div class="text-sm text-gray-600 ml-auto">
               {{ range().start | date: 'mediumDate' }} – {{ rangeEndInclusive() | date: 'mediumDate' }}
            </div>
         </div>

         @if (orders() === undefined) {
            <div class="flex justify-center p-12">
               <mat-spinner diameter="40"></mat-spinner>
            </div>
         } @else {
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
               <div class="bg-white rounded-lg shadow p-5">
                  <div class="text-xs text-gray-500 uppercase tracking-wide">Total recaudado</div>
                  <div class="text-2xl font-bold text-emerald-600 mt-1 font-mono">
                     {{ summary().total | currency: 'BOB' : 'symbol-narrow' : '1.2-2' }}
                  </div>
               </div>
               <div class="bg-white rounded-lg shadow p-5">
                  <div class="text-xs text-gray-500 uppercase tracking-wide">Ventas</div>
                  <div class="text-2xl font-bold mt-1 font-mono">{{ summary().count }}</div>
               </div>
               <div class="bg-white rounded-lg shadow p-5">
                  <div class="text-xs text-gray-500 uppercase tracking-wide">Ticket prom.</div>
                  <div class="text-2xl font-bold mt-1 font-mono">{{ summary().average | currency: 'BOB' : 'symbol-narrow' : '1.2-2' }}</div>
               </div>
               <div class="bg-white rounded-lg shadow p-5">
                  <div class="text-xs text-gray-500 uppercase tracking-wide">Costo total</div>
                  <div class="text-2xl font-bold mt-1 font-mono text-gray-700">
                     {{ summary().cost | currency: 'BOB' : 'symbol-narrow' : '1.2-2' }}
                  </div>
               </div>
               <div class="bg-white rounded-lg shadow p-5">
                  <div class="text-xs text-gray-500 uppercase tracking-wide">Ganancia</div>
                  <div
                     class="text-2xl font-bold mt-1 font-mono"
                     [class.text-emerald-600]="summary().profit > 0"
                     [class.text-red-600]="summary().profit < 0"
                     [class.text-gray-700]="summary().profit === 0"
                  >
                     {{ summary().profit | currency: 'BOB' : 'symbol-narrow' : '1.2-2' }}
                  </div>
               </div>
               <div class="bg-white rounded-lg shadow p-5">
                  <div class="text-xs text-gray-500 uppercase tracking-wide">Margen</div>
                  <div class="text-2xl font-bold mt-1 font-mono">
                     {{ (summary().margin * 100) | number: '1.0-1' }}%
                  </div>
               </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
               <div class="bg-white rounded-lg shadow overflow-hidden">
                  <div class="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
                     <span class="material-symbols-rounded text-gray-600">calendar_month</span>
                     <h3 class="font-semibold">Ventas por día</h3>
                  </div>
                  @if (daily().length === 0) {
                     <p class="p-6 text-center text-gray-500">Sin ventas en este rango.</p>
                  } @else {
                     <table mat-table [dataSource]="daily()" class="w-full">
                        <ng-container matColumnDef="date">
                           <th mat-header-cell *matHeaderCellDef>Día</th>
                           <td mat-cell *matCellDef="let d">{{ d.date | date: 'EEE d MMM' }}</td>
                        </ng-container>
                        <ng-container matColumnDef="count">
                           <th mat-header-cell *matHeaderCellDef class="text-right">Ventas</th>
                           <td mat-cell *matCellDef="let d" class="text-right">{{ d.count }}</td>
                        </ng-container>
                        <ng-container matColumnDef="total">
                           <th mat-header-cell *matHeaderCellDef class="text-right">Total</th>
                           <td mat-cell *matCellDef="let d" class="text-right font-semibold font-mono">
                              {{ d.total | currency: 'BOB' : 'symbol-narrow' : '1.2-2' }}
                           </td>
                        </ng-container>
                        <ng-container matColumnDef="cost">
                           <th mat-header-cell *matHeaderCellDef class="text-right">Costo</th>
                           <td mat-cell *matCellDef="let d" class="text-right text-gray-600 font-mono">
                              {{ d.cost | currency: 'BOB' : 'symbol-narrow' : '1.2-2' }}
                           </td>
                        </ng-container>
                        <ng-container matColumnDef="profit">
                           <th mat-header-cell *matHeaderCellDef class="text-right">Ganancia</th>
                           <td
                              mat-cell
                              *matCellDef="let d"
                              class="text-right font-semibold font-mono"
                              [class.text-emerald-600]="d.profit > 0"
                              [class.text-red-600]="d.profit < 0"
                           >
                              {{ d.profit | currency: 'BOB' : 'symbol-narrow' : '1.2-2' }}
                           </td>
                        </ng-container>
                        <tr mat-header-row *matHeaderRowDef="dailyCols"></tr>
                        <tr mat-row *matRowDef="let row; columns: dailyCols"></tr>
                     </table>
                  }
               </div>

               <div class="bg-white rounded-lg shadow overflow-hidden">
                  <div class="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
                     <span class="material-symbols-rounded text-gray-600">emoji_events</span>
                     <h3 class="font-semibold">Productos más vendidos</h3>
                  </div>
                  @if (topProducts().length === 0) {
                     <p class="p-6 text-center text-gray-500">Sin productos en este rango.</p>
                  } @else {
                     <table mat-table [dataSource]="topProducts()" class="w-full">
                        <ng-container matColumnDef="rank">
                           <th mat-header-cell *matHeaderCellDef>#</th>
                           <td mat-cell *matCellDef="let _; let i = index" class="w-8 text-gray-500">
                              {{ i + 1 }}
                           </td>
                        </ng-container>
                        <ng-container matColumnDef="name">
                           <th mat-header-cell *matHeaderCellDef>Producto</th>
                           <td mat-cell *matCellDef="let p">{{ p.name }}</td>
                        </ng-container>
                        <ng-container matColumnDef="quantity">
                           <th mat-header-cell *matHeaderCellDef class="text-right">Unidades</th>
                           <td mat-cell *matCellDef="let p" class="text-right font-semibold">
                              {{ p.quantity }}
                           </td>
                        </ng-container>
                        <ng-container matColumnDef="total">
                           <th mat-header-cell *matHeaderCellDef class="text-right">Total</th>
                           <td mat-cell *matCellDef="let p" class="text-right">
                              {{ p.total | currency: 'BOB' : 'symbol-narrow' : '1.2-2' }}
                           </td>
                        </ng-container>
                        <tr mat-header-row *matHeaderRowDef="topCols"></tr>
                        <tr mat-row *matRowDef="let row; columns: topCols"></tr>
                     </table>
                  }
               </div>
            </div>
         }
      </div>
   `,
})
export default class AdminReportsComponent {
   private reportService = inject(ReportService)

   dailyCols = ['date', 'count', 'total', 'cost', 'profit']
   topCols = ['rank', 'name', 'quantity', 'total']

   preset = signal<Preset>('hoy')
   customStart = signal<Date>(startOfDay(new Date()))
   customEnd = signal<Date>(new Date())

   range = computed<Range>(() => {
      const today = new Date()
      switch (this.preset()) {
         case 'hoy': {
            const start = startOfDay(today)
            const end = addDays(start, 1)
            return { start, end }
         }
         case 'semana': {
            const start = startOfWeek(today)
            const end = addDays(start, 7)
            return { start, end }
         }
         case 'mes': {
            const start = new Date(today.getFullYear(), today.getMonth(), 1)
            const end = new Date(today.getFullYear(), today.getMonth() + 1, 1)
            return { start, end }
         }
         case 'custom': {
            const s = startOfDay(this.customStart())
            const e = addDays(startOfDay(this.customEnd()), 1)
            return e > s ? { start: s, end: e } : { start: s, end: addDays(s, 1) }
         }
      }
   })

   rangeEndInclusive = computed(() => addDays(this.range().end, -1))

   orders = toSignal(
      toObservable(this.range).pipe(
         switchMap((r) => this.reportService.getDeliveredOrders(r.start, r.end))
      ),
      { initialValue: undefined }
   )

   summary = computed(() => this.reportService.summary(this.orders() ?? []))

   daily = computed(() => {
      const r = this.range()
      return this.reportService.byDay(this.orders() ?? [], r.start, r.end)
   })

   topProducts = computed(() => this.reportService.topProducts(this.orders() ?? [], 10))

   setPreset(p: Preset) {
      this.preset.set(p)
   }

   setCustomStart(d: Date | null) {
      if (d) this.customStart.set(d)
   }

   setCustomEnd(d: Date | null) {
      if (d) this.customEnd.set(d)
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
   // Lunes como inicio de semana.
   const x = startOfDay(d)
   const day = x.getDay() // 0 = dom
   const offset = day === 0 ? 6 : day - 1
   x.setDate(x.getDate() - offset)
   return x
}
