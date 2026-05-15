import { Component, Inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import {
   FormBuilder,
   FormGroup,
   ReactiveFormsModule,
   Validators,
} from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { provideNativeDateAdapter } from '@angular/material/core'
import { Timestamp } from '@angular/fire/firestore'
import { AppUser, PaymentCreate, PaymentType } from '../../../../../../models/user.model'

export interface PaymentFormDialogData {
   user: AppUser
}

@Component({
   selector: 'x-payment-form-dialog',
   standalone: true,
   providers: [provideNativeDateAdapter()],
   imports: [
      CommonModule,
      ReactiveFormsModule,
      MatDialogModule,
      MatButtonModule,
      MatButtonToggleModule,
      MatFormFieldModule,
      MatInputModule,
      MatSelectModule,
      MatDatepickerModule,
   ],
   template: `
      <h2 mat-dialog-title class="flex items-center gap-2">
         <span class="material-symbols-rounded">{{ type() === 'descuento' ? 'remove_circle' : 'payments' }}</span>
         {{ type() === 'descuento' ? 'Registrar descuento' : 'Registrar pago' }}
      </h2>
      <p class="text-sm text-gray-600 -mt-2 mb-2 px-6">
         {{ data.user.displayName }} ({{ data.user.email }})
      </p>
      <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-3 min-w-[420px]">
         <mat-dialog-content class="flex flex-col gap-3">
            <mat-button-toggle-group
               formControlName="type"
               class="self-start"
               hideSingleSelectionIndicator
            >
               <mat-button-toggle value="pago">
                  <span class="material-symbols-rounded align-middle mr-1">payments</span>
                  Pago
               </mat-button-toggle>
               <mat-button-toggle value="descuento">
                  <span class="material-symbols-rounded align-middle mr-1">remove_circle</span>
                  Descuento
               </mat-button-toggle>
            </mat-button-toggle-group>

            <mat-form-field appearance="outline">
               <mat-label>Monto</mat-label>
               <input matInput type="number" formControlName="amount" min="0.01" step="0.01" />
               <span matTextPrefix>Bs&nbsp;</span>
               @if (form.get('amount')?.hasError('required')) {
                  <mat-error>Requerido</mat-error>
               } @else if (form.get('amount')?.hasError('min')) {
                  <mat-error>Debe ser mayor a 0</mat-error>
               }
            </mat-form-field>

            @if (type() === 'descuento') {
               <mat-form-field appearance="outline">
                  <mat-label>Motivo</mat-label>
                  <mat-select formControlName="reason">
                     <mat-option value="sancion">Sanción</mat-option>
                     <mat-option value="permiso">Permiso</mat-option>
                     <mat-option value="reemplazo">Cubrió otro empleado</mat-option>
                     <mat-option value="adelanto">Adelanto</mat-option>
                     <mat-option value="otro">Otro</mat-option>
                  </mat-select>
                  @if (form.get('reason')?.hasError('required')) {
                     <mat-error>Requerido</mat-error>
                  }
               </mat-form-field>
            }

            <mat-form-field appearance="outline">
               <mat-label>{{ type() === 'descuento' ? 'Fecha' : 'Fecha del pago' }}</mat-label>
               <input matInput [matDatepicker]="paidPicker" formControlName="paidAt" />
               <mat-datepicker-toggle matIconSuffix [for]="paidPicker"></mat-datepicker-toggle>
               <mat-datepicker #paidPicker></mat-datepicker>
            </mat-form-field>

            <div class="flex gap-2">
               <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>Periodo desde</mat-label>
                  <input matInput [matDatepicker]="startPicker" formControlName="periodStart" />
                  <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
                  <mat-datepicker #startPicker></mat-datepicker>
               </mat-form-field>
               <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>Periodo hasta</mat-label>
                  <input matInput [matDatepicker]="endPicker" formControlName="periodEnd" />
                  <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
                  <mat-datepicker #endPicker></mat-datepicker>
               </mat-form-field>
            </div>

            <mat-form-field appearance="outline">
               <mat-label>{{ type() === 'descuento' ? 'Detalle del motivo' : 'Nota (opcional)' }}</mat-label>
               <textarea matInput formControlName="note" rows="2"></textarea>
            </mat-form-field>
         </mat-dialog-content>
         <mat-dialog-actions align="end">
            <button mat-button type="button" (click)="cancel()">Cancelar</button>
            <button
               mat-raised-button
               [color]="type() === 'descuento' ? 'warn' : 'primary'"
               type="submit"
               [disabled]="form.invalid"
            >
               {{ type() === 'descuento' ? 'Registrar descuento' : 'Registrar pago' }}
            </button>
         </mat-dialog-actions>
      </form>
   `,
})
export class PaymentFormDialogComponent {
   form: FormGroup

   constructor(
      private fb: FormBuilder,
      private dialogRef: MatDialogRef<PaymentFormDialogComponent, PaymentCreate | null>,
      @Inject(MAT_DIALOG_DATA) public data: PaymentFormDialogData
   ) {
      const today = new Date()
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

      this.form = this.fb.group({
         type: ['pago' as PaymentType, Validators.required],
         amount: [data.user.salary ?? 0, [Validators.required, Validators.min(0.01)]],
         reason: [''],
         paidAt: [today, Validators.required],
         periodStart: [firstOfMonth, Validators.required],
         periodEnd: [lastOfMonth, Validators.required],
         note: [''],
      })

      this.form.get('type')!.valueChanges.subscribe((t: PaymentType) => {
         const reasonCtrl = this.form.get('reason')!
         if (t === 'descuento') {
            reasonCtrl.setValidators([Validators.required])
         } else {
            reasonCtrl.clearValidators()
            reasonCtrl.setValue('')
         }
         reasonCtrl.updateValueAndValidity()
      })
   }

   type(): PaymentType {
      return this.form.get('type')!.value as PaymentType
   }

   submit() {
      if (this.form.invalid) return
      const raw = this.form.value

      const result: PaymentCreate = {
         type: raw.type,
         amount: Number(raw.amount),
         paidAt: Timestamp.fromDate(raw.paidAt),
         periodStart: Timestamp.fromDate(raw.periodStart),
         periodEnd: Timestamp.fromDate(raw.periodEnd),
         reason: raw.type === 'descuento' ? raw.reason : undefined,
         note: (raw.note ?? '').trim() || undefined,
         createdBy: '',
      }
      this.dialogRef.close(result)
   }

   cancel() {
      this.dialogRef.close(null)
   }
}
