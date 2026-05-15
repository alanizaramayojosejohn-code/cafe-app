import { Component, computed, inject } from '@angular/core'
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common'
import { Router } from '@angular/router'
import { toSignal } from '@angular/core/rxjs-interop'
import { MatButtonModule } from '@angular/material/button'
import { MatTableModule } from '@angular/material/table'
import { MatChipsModule } from '@angular/material/chips'
import { MatTooltipModule } from '@angular/material/tooltip'
import { MatMenuModule } from '@angular/material/menu'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { UserService } from '../../../../../services/user/user.service'
import { AuthService } from '../../../../../services/auth/auth.service'
import { AppUser, PendingUser, UserRole } from '../../../../../models/user.model'
import {
   UserFormDialogComponent,
   UserFormDialogData,
   UserFormResult,
} from '../components/user-form/user-form.dialog'

type Row =
   | ({ kind: 'active' } & AppUser)
   | ({ kind: 'pending' } & PendingUser)

@Component({
   selector: 'x-admin-users',
   standalone: true,
   imports: [
      CommonModule,
      CurrencyPipe,
      DatePipe,
      MatButtonModule,
      MatTableModule,
      MatChipsModule,
      MatTooltipModule,
      MatMenuModule,
      MatDialogModule,
      MatSnackBarModule,
      MatProgressSpinnerModule,
   ],
   templateUrl: './component.html',
})
export default class AdminUsersComponent {
   private userService = inject(UserService)
   private authService = inject(AuthService)
   private dialog = inject(MatDialog)
   private snack = inject(MatSnackBar)
   private router = inject(Router)

   columns = ['user', 'role', 'salary', 'status', 'actions']

   users = toSignal<AppUser[] | undefined>(this.userService.getUsers(), { initialValue: undefined })
   pending = toSignal<PendingUser[] | undefined>(this.userService.getPendingUsers(), {
      initialValue: undefined,
   })

   rows = computed<Row[]>(() => {
      const active = (this.users() ?? []).map((u) => ({ kind: 'active' as const, ...u }))
      const pending = (this.pending() ?? []).map((p) => ({ kind: 'pending' as const, ...p }))
      return [...pending, ...active]
   })

   loading = computed(() => this.users() === undefined || this.pending() === undefined)

   roleLabel(role: UserRole) {
      return role === 'admin' ? 'Admin' : role === 'cajero' ? 'Cajero' : 'Cocinero'
   }

   openInvite() {
      this.openForm({ mode: 'invite' })
   }

   openEdit(row: Row) {
      this.openForm({
         mode: row.kind === 'pending' ? 'edit-pending' : 'edit-active',
         user: row,
      })
   }

   private openForm(data: UserFormDialogData) {
      const ref = this.dialog.open<UserFormDialogComponent, UserFormDialogData, UserFormResult | null>(
         UserFormDialogComponent,
         { data, autoFocus: false }
      )

      ref.afterClosed().subscribe(async (result) => {
         if (!result) return
         try {
            if (data.mode === 'invite') {
               await this.userService.createPendingUser({
                  email: result.email,
                  displayName: result.displayName,
                  role: result.role,
                  salary: result.salary,
                  salaryPeriod: result.salaryPeriod,
                  isActive: result.isActive,
                  invitedBy: this.authService.currentUser()?.uid ?? '',
               })
               this.snack.open('Invitación creada', 'OK', { duration: 2500 })
            } else if (data.mode === 'edit-pending') {
               await this.userService.updatePendingUser(result.email, {
                  displayName: result.displayName,
                  role: result.role,
                  salary: result.salary,
                  salaryPeriod: result.salaryPeriod,
                  isActive: result.isActive,
               })
               this.snack.open('Invitación actualizada', 'OK', { duration: 2500 })
            } else {
               const target = data.user as AppUser
               await this.userService.updateUser(target.id, {
                  displayName: result.displayName,
                  role: result.role,
                  salary: result.salary,
                  salaryPeriod: result.salaryPeriod,
                  isActive: result.isActive,
               })
               this.snack.open('Usuario actualizado', 'OK', { duration: 2500 })
            }
         } catch (e: any) {
            this.snack.open('Error: ' + (e?.message ?? e), 'OK', { duration: 4000 })
         }
      })
   }

   async toggleActive(row: Row) {
      try {
         if (row.kind === 'active') {
            await this.userService.toggleUserStatus(row.id, !row.isActive)
         } else {
            await this.userService.updatePendingUser(row.email, { isActive: !row.isActive })
         }
      } catch {
         this.snack.open('Error al cambiar estado', 'OK', { duration: 3000 })
      }
   }

   async softDelete(row: Row) {
      if (row.kind === 'active') {
         if (!confirm(`¿Desactivar a ${row.displayName}?`)) return
         await this.userService.softDeleteUser(row.id)
         this.snack.open('Usuario desactivado', 'OK', { duration: 2500 })
      } else {
         if (!confirm(`¿Eliminar invitación para ${row.email}?`)) return
         await this.userService.deletePendingUser(row.email)
         this.snack.open('Invitación eliminada', 'OK', { duration: 2500 })
      }
   }

   openPayments(row: Row) {
      if (row.kind !== 'active') {
         this.snack.open('El usuario debe iniciar sesión antes de registrar pagos', 'OK', {
            duration: 3500,
         })
         return
      }
      this.router.navigate(['/admin/usuarios', row.id, 'pagos'])
   }
}
