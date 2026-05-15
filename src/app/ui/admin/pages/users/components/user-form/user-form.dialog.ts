import { Component, Inject, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { AppUser, PendingUser, SalaryPeriod, UserRole } from '../../../../../../models/user.model'

export type UserFormMode = 'invite' | 'edit-pending' | 'edit-active'

export interface UserFormDialogData {
   mode: UserFormMode
   user?: AppUser | PendingUser
}

export interface UserFormResult {
   email: string
   displayName: string
   role: UserRole
   salary: number
   salaryPeriod: SalaryPeriod
   isActive: boolean
}

@Component({
   selector: 'x-user-form-dialog',
   standalone: true,
   imports: [
      CommonModule,
      ReactiveFormsModule,
      MatDialogModule,
      MatButtonModule,
      MatFormFieldModule,
      MatInputModule,
      MatSelectModule,
   ],
   template: `
      <h2 mat-dialog-title class="flex items-center gap-2">
         <span class="material-symbols-rounded">{{ titleIcon() }}</span>
         {{ title() }}
      </h2>
      <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-3 min-w-[360px] pt-2">
         <mat-dialog-content class="flex flex-col gap-3">
            <mat-form-field appearance="outline">
               <mat-label>Correo electrónico</mat-label>
               <input matInput type="email" formControlName="email" autocomplete="off" />
               @if (form.get('email')?.hasError('required')) {
                  <mat-error>Requerido</mat-error>
               } @else if (form.get('email')?.hasError('email')) {
                  <mat-error>Email inválido</mat-error>
               }
            </mat-form-field>

            <mat-form-field appearance="outline">
               <mat-label>Nombre</mat-label>
               <input matInput formControlName="displayName" />
               @if (form.get('displayName')?.hasError('required')) {
                  <mat-error>Requerido</mat-error>
               }
            </mat-form-field>

            <mat-form-field appearance="outline">
               <mat-label>Rol</mat-label>
               <mat-select formControlName="role">
                  <mat-option value="admin">Admin</mat-option>
                  <mat-option value="cajero">Cajero</mat-option>
                  <mat-option value="cocinero">Cocinero</mat-option>
               </mat-select>
            </mat-form-field>

            <div class="flex gap-2">
               <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>Sueldo</mat-label>
                  <input matInput type="number" formControlName="salary" min="0" step="0.01" />
                  <span matTextPrefix>Bs&nbsp;</span>
                  @if (form.get('salary')?.hasError('min')) {
                     <mat-error>Debe ser positivo</mat-error>
                  }
               </mat-form-field>
               <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>Período</mat-label>
                  <mat-select formControlName="salaryPeriod">
                     <mat-option value="mensual">Mensual</mat-option>
                     <mat-option value="quincenal">Quincenal</mat-option>
                     <mat-option value="semanal">Semanal</mat-option>
                  </mat-select>
               </mat-form-field>
            </div>

            @if (error()) {
               <div class="text-red-600 text-sm">{{ error() }}</div>
            }
         </mat-dialog-content>
         <mat-dialog-actions align="end">
            <button mat-button type="button" (click)="cancel()">Cancelar</button>
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
               {{ submitLabel() }}
            </button>
         </mat-dialog-actions>
      </form>
   `,
})
export class UserFormDialogComponent {
   form: FormGroup
   error = signal<string>('')
   private mode: UserFormMode

   constructor(
      private fb: FormBuilder,
      private dialogRef: MatDialogRef<UserFormDialogComponent, UserFormResult | null>,
      @Inject(MAT_DIALOG_DATA) public data: UserFormDialogData
   ) {
      this.mode = data.mode
      const user = data.user

      this.form = this.fb.group({
         email: [
            { value: user?.email ?? '', disabled: this.mode !== 'invite' },
            [Validators.required, Validators.email],
         ],
         displayName: [user?.displayName ?? '', Validators.required],
         role: [user?.role ?? 'cajero', Validators.required],
         salary: [user?.salary ?? 0, [Validators.required, Validators.min(0)]],
         salaryPeriod: [user?.salaryPeriod ?? 'mensual', Validators.required],
         isActive: [user?.isActive ?? true],
      })
   }

   title() {
      switch (this.mode) {
         case 'invite':
            return 'Invitar usuario'
         case 'edit-pending':
            return 'Editar invitación'
         case 'edit-active':
            return 'Editar usuario'
      }
   }

   titleIcon() {
      return this.mode === 'invite' ? 'person_add' : 'edit'
   }

   submitLabel() {
      return this.mode === 'invite' ? 'Enviar invitación' : 'Guardar cambios'
   }

   submit() {
      if (this.form.invalid) return
      const raw = this.form.getRawValue()
      const result: UserFormResult = {
         email: String(raw.email).trim().toLowerCase(),
         displayName: String(raw.displayName).trim(),
         role: raw.role,
         salary: Number(raw.salary) || 0,
         salaryPeriod: raw.salaryPeriod,
         isActive: !!raw.isActive,
      }
      this.dialogRef.close(result)
   }

   cancel() {
      this.dialogRef.close(null)
   }
}
