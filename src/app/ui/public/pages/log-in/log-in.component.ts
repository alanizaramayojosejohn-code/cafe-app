import { Component, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { AuthService } from '../../../../services/auth/auth.service'
import { UserService } from '../../../../services/user/user.service'

@Component({
   selector: 'app-log-in',
   imports: [CommonModule, ReactiveFormsModule],
   providers: [UserService],
   templateUrl: './log-in.component.html',
})
export default class LogInComponent {
   loginForm: FormGroup
   loading = signal(false)
   errorMessage = signal('')
   successMessage = signal('')
   hidePassword = signal(true)
   sendingReset = signal(false)

   constructor(
      private fb: FormBuilder,
      private authService: AuthService,
      private router: Router,
      private route: ActivatedRoute
   ) {
      this.loginForm = this.fb.group({
         email: ['', [Validators.required, Validators.email]],
         password: ['', [Validators.required, Validators.minLength(6)]],
      })
   }

   togglePasswordVisibility() {
      this.hidePassword.set(!this.hidePassword())
   }

   async onSubmit() {
      if (this.loginForm.valid) {
         this.loading.set(true)
         this.errorMessage.set('')
         this.successMessage.set('')

         const { email, password } = this.loginForm.value

         try {
            await this.authService.loginWithEmail(email, password)
            await this.redirectAfterLogin()
         } catch (error: any) {
            this.errorMessage.set(error)
         } finally {
            this.loading.set(false)
         }
      } else {
         this.loginForm.markAllAsTouched()
      }
   }

   async onForgotPassword() {
      const emailControl = this.loginForm.get('email')
      const email = (emailControl?.value ?? '').trim()

      if (!email || emailControl?.invalid) {
         emailControl?.markAsTouched()
         this.errorMessage.set('Ingresa tu correo para recibir el enlace de recuperación')
         this.successMessage.set('')
         return
      }

      this.sendingReset.set(true)
      this.errorMessage.set('')
      this.successMessage.set('')

      try {
         await this.authService.sendPasswordReset(email)
         this.successMessage.set(`Te enviamos un correo a ${email} para renovar tu contraseña`)
      } catch (error: any) {
         this.errorMessage.set(error)
      } finally {
         this.sendingReset.set(false)
      }
   }

   async loginWithGoogle() {
      this.loading.set(true)
      this.errorMessage.set('')

      try {
         await this.authService.loginWithGoogle()
         await this.redirectAfterLogin()
      } catch (error: any) {
         this.errorMessage.set(error)
      } finally {
         this.loading.set(false)
      }
   }

   private async redirectAfterLogin() {
      const returnUrl = this.route.snapshot.queryParams['returnUrl']
      if (returnUrl) {
         await this.router.navigateByUrl(returnUrl)
      } else {
         await this.authService.redirectByRole()
      }
   }

   getEmailErrorMessage() {
      const emailControl = this.loginForm.get('email')
      if (emailControl?.hasError('required')) {
         return 'El email es requerido'
      }
      if (emailControl?.hasError('email')) {
         return 'Email inválido'
      }
      return ''
   }

   getPasswordErrorMessage() {
      const passwordControl = this.loginForm.get('password')
      if (passwordControl?.hasError('required')) {
         return 'La contraseña es requerida'
      }
      if (passwordControl?.hasError('minlength')) {
         return 'Mínimo 6 caracteres'
      }
      return ''
   }
}
