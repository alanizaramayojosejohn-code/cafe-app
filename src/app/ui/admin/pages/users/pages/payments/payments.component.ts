import { Component, computed, inject, signal } from '@angular/core'
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common'
import { ActivatedRoute, Router } from '@angular/router'
import { toSignal } from '@angular/core/rxjs-interop'
import { MatButtonModule } from '@angular/material/button'
import { MatChipsModule } from '@angular/material/chips'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatTableModule } from '@angular/material/table'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { UserService } from '../../../../../../services/user/user.service'
import { PaymentService } from '../../../../../../services/payment/payment.service'
import { AuthService } from '../../../../../../services/auth/auth.service'
import { AppUser, Payment } from '../../../../../../models/user.model'
import {
   PaymentFormDialogComponent,
   PaymentFormDialogData,
} from '../../components/payment-form/payment-form.dialog'

@Component({
   selector: 'x-user-payments',
   standalone: true,
   imports: [
      CommonModule,
      DatePipe,
      CurrencyPipe,
      MatButtonModule,
      MatChipsModule,
      MatDialogModule,
      MatTableModule,
      MatProgressSpinnerModule,
      MatSnackBarModule,
   ],
   template: `
      <div class="p-6">
         <div class="flex items-center gap-3 mb-6">
            <button mat-icon-button (click)="back()" aria-label="Volver">
               <span class="material-symbols-rounded">arrow_back</span>
            </button>
            <div class="flex-1">
               <h2 class="text-2xl font-bold">Historial de pagos</h2>
               @if (user()) {
                  <p class="text-sm text-gray-600">
                     {{ user()!.displayName }} · {{ user()!.email }} · Sueldo base:
                     <strong>{{ user()!.salary | currency: 'BOB' : 'symbol-narrow' : '1.2-2' }}</strong>
                     / {{ user()!.salaryPeriod }}
                  </p>
               }
            </div>
            <button mat-raised-button color="primary" (click)="openPaymentForm()" [disabled]="!user()">
               <span class="material-symbols-rounded align-middle mr-1">add</span>
               Registrar movimiento
            </button>
         </div>

         @if (payments() === undefined) {
            <div class="flex justify-center p-12">
               <mat-spinner diameter="40"></mat-spinner>
            </div>
         } @else if (payments()!.length === 0) {
            <div class="text-center p-12 text-gray-500 bg-white rounded-lg shadow">
               <span class="material-symbols-rounded text-6xl opacity-30">payments</span>
               <p class="mt-2">Sin movimientos registrados</p>
            </div>
         } @else {
            <div class="grid grid-cols-3 gap-3 mb-4">
               <div class="bg-white rounded-lg shadow p-4">
                  <div class="text-xs text-gray-500 uppercase">Pagos</div>
                  <div class="text-xl font-bold text-emerald-600">{{ totalPagos() | currency: 'BOB' : 'symbol-narrow' : '1.2-2' }}</div>
               </div>
               <div class="bg-white rounded-lg shadow p-4">
                  <div class="text-xs text-gray-500 uppercase">Descuentos</div>
                  <div class="text-xl font-bold text-red-600">− {{ totalDescuentos() | currency: 'BOB' : 'symbol-narrow' : '1.2-2' }}</div>
               </div>
               <div class="bg-white rounded-lg shadow p-4">
                  <div class="text-xs text-gray-500 uppercase">Neto</div>
                  <div class="text-xl font-bold">{{ totalNeto() | currency: 'BOB' : 'symbol-narrow' : '1.2-2' }}</div>
               </div>
            </div>

            <div class="bg-white rounded-lg shadow overflow-hidden">
               <table mat-table [dataSource]="payments()!" class="w-full">
                  <ng-container matColumnDef="type">
                     <th mat-header-cell *matHeaderCellDef>Tipo</th>
                     <td mat-cell *matCellDef="let p">
                        @if ((p.type ?? 'pago') === 'descuento') {
                           <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              <span class="material-symbols-rounded text-sm">remove_circle</span>
                              Descuento
                           </span>
                        } @else {
                           <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              <span class="material-symbols-rounded text-sm">payments</span>
                              Pago
                           </span>
                        }
                     </td>
                  </ng-container>
                  <ng-container matColumnDef="paidAt">
                     <th mat-header-cell *matHeaderCellDef>Fecha</th>
                     <td mat-cell *matCellDef="let p">{{ p.paidAt?.toDate() | date: 'mediumDate' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="period">
                     <th mat-header-cell *matHeaderCellDef>Periodo</th>
                     <td mat-cell *matCellDef="let p">
                        {{ p.periodStart?.toDate() | date: 'shortDate' }} –
                        {{ p.periodEnd?.toDate() | date: 'shortDate' }}
                     </td>
                  </ng-container>
                  <ng-container matColumnDef="amount">
                     <th mat-header-cell *matHeaderCellDef class="text-right">Monto</th>
                     <td
                        mat-cell
                        *matCellDef="let p"
                        class="text-right font-semibold"
                        [class.text-red-600]="(p.type ?? 'pago') === 'descuento'"
                        [class.text-emerald-700]="(p.type ?? 'pago') !== 'descuento'"
                     >
                        {{ (p.type ?? 'pago') === 'descuento' ? '−' : '' }} {{ p.amount | currency: 'BOB' : 'symbol-narrow' : '1.2-2' }}
                     </td>
                  </ng-container>
                  <ng-container matColumnDef="reason">
                     <th mat-header-cell *matHeaderCellDef>Motivo / Nota</th>
                     <td mat-cell *matCellDef="let p" class="text-sm text-gray-600">
                        @if (p.reason) {
                           <span class="font-medium text-gray-800">{{ reasonLabel(p.reason) }}</span>
                           @if (p.note) {
                              <span class="text-gray-500"> · {{ p.note }}</span>
                           }
                        } @else {
                           {{ p.note || '—' }}
                        }
                     </td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                     <th mat-header-cell *matHeaderCellDef></th>
                     <td mat-cell *matCellDef="let p">
                        <button mat-icon-button color="warn" (click)="deletePayment(p.id)">
                           <span class="material-symbols-rounded">delete</span>
                        </button>
                     </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="columns"></tr>
                  <tr mat-row *matRowDef="let row; columns: columns"></tr>
               </table>
            </div>
         }
      </div>
   `,
})
export default class UserPaymentsComponent {
   private route = inject(ActivatedRoute)
   private router = inject(Router)
   private userService = inject(UserService)
   private paymentService = inject(PaymentService)
   private authService = inject(AuthService)
   private dialog = inject(MatDialog)
   private snack = inject(MatSnackBar)

   columns = ['type', 'paidAt', 'period', 'amount', 'reason', 'actions']

   uid = signal<string>(this.route.snapshot.paramMap.get('uid') ?? '')
   user = signal<AppUser | null>(null)

   payments = toSignal<Payment[] | undefined>(this.paymentService.getPaymentsForUser(this.uid()), {
      initialValue: undefined,
   })

   totalPagos = computed(() =>
      (this.payments() ?? [])
         .filter((p) => (p.type ?? 'pago') !== 'descuento')
         .reduce((s, p) => s + (p.amount || 0), 0)
   )

   totalDescuentos = computed(() =>
      (this.payments() ?? [])
         .filter((p) => (p.type ?? 'pago') === 'descuento')
         .reduce((s, p) => s + (p.amount || 0), 0)
   )

   totalNeto = computed(() => this.totalPagos() - this.totalDescuentos())

   constructor() {
      this.loadUser()
   }

   private async loadUser() {
      const u = await this.userService.getUserByUid(this.uid())
      this.user.set(u)
   }

   reasonLabel(reason: string): string {
      switch (reason) {
         case 'sancion':
            return 'Sanción'
         case 'permiso':
            return 'Permiso'
         case 'reemplazo':
            return 'Cubrió otro empleado'
         case 'adelanto':
            return 'Adelanto'
         case 'otro':
            return 'Otro'
         default:
            return reason
      }
   }

   back() {
      this.router.navigate(['/admin/usuarios'])
   }

   openPaymentForm() {
      const u = this.user()
      if (!u) return

      const dialogRef = this.dialog.open<
         PaymentFormDialogComponent,
         PaymentFormDialogData,
         any
      >(PaymentFormDialogComponent, {
         data: { user: u },
      })

      dialogRef.afterClosed().subscribe(async (result) => {
         if (!result) return
         try {
            result.createdBy = this.authService.currentUser()?.uid ?? ''
            await this.paymentService.createPayment(this.uid(), result)
            this.snack.open(
               result.type === 'descuento' ? 'Descuento registrado' : 'Pago registrado',
               'OK',
               { duration: 2500 }
            )
         } catch (e: any) {
            this.snack.open('Error: ' + (e?.message ?? e), 'OK', { duration: 4000 })
         }
      })
   }

   async deletePayment(paymentId: string) {
      if (!confirm('¿Eliminar este movimiento?')) return
      try {
         await this.paymentService.deletePayment(this.uid(), paymentId)
         this.snack.open('Movimiento eliminado', 'OK', { duration: 2000 })
      } catch (e: any) {
         this.snack.open('Error al eliminar', 'OK', { duration: 3000 })
      }
   }
}
