import { Injectable, signal } from '@angular/core'
import {
   Auth,
   createUserWithEmailAndPassword,
   signInWithEmailAndPassword,
   signInWithPopup,
   GoogleAuthProvider,
   signOut,
   authState,
   User,
} from '@angular/fire/auth'
import { Observable } from 'rxjs'
import { Router } from '@angular/router'

@Injectable({
   providedIn: 'root',
})
export class AuthService {
   user$: Observable<User | null>
   currentUser = signal<User | null>(null)

   constructor(
      private auth: Auth,
      private router: Router
   ) {
      this.user$ = authState(this.auth)

      this.user$.subscribe((user) => {
         this.currentUser.set(user)
      })
   }

   async registerWithEmail(email: string, password: string) {
      try {
         const credential = await createUserWithEmailAndPassword(this.auth, email, password)
         return credential
      } catch (error: any) {
         throw this.handleError(error)
      }
   }

   async loginWithEmail(email: string, password: string) {
      try {
         const credential = await signInWithEmailAndPassword(this.auth, email, password)
         return credential
      } catch (error: any) {
         throw this.handleError(error)
      }
   }

   async loginWithGoogle() {
      try {
         const provider = new GoogleAuthProvider()
         provider.setCustomParameters({
            prompt: 'select_account',
         })
         const credential = await signInWithPopup(this.auth, provider)
         return credential
      } catch (error: any) {
         throw this.handleError(error)
      }
   }

   async logout() {
      try {
         await signOut(this.auth)
         this.router.navigate(['/log-in'])
      } catch (error: any) {
         throw this.handleError(error)
      }
   }

   getCurrentUser(): User | null {
      return this.auth.currentUser
   }

   isAuthenticated(): boolean {
      return this.currentUser() !== null
   }

   private handleError(error: any): string {
      let errorMessage = 'Ocurrió un error'

      switch (error.code) {
         case 'auth/email-already-in-use':
            errorMessage = 'Este email ya está registrado'
            break
         case 'auth/invalid-email':
            errorMessage = 'Email inválido'
            break
         case 'auth/weak-password':
            errorMessage = 'La contraseña debe tener al menos 6 caracteres'
            break
         case 'auth/user-not-found':
            errorMessage = 'Usuario no encontrado'
            break
         case 'auth/wrong-password':
            errorMessage = 'Contraseña incorrecta'
            break
         case 'auth/invalid-credential':
            errorMessage = 'Credenciales inválidas'
            break
         case 'auth/popup-closed-by-user':
            errorMessage = 'Ventana cerrada antes de completar el inicio de sesión'
            break
         case 'auth/cancelled-popup-request':
            errorMessage = 'Solo se puede abrir una ventana a la vez'
            break
         default:
            errorMessage = error.message
      }

      return errorMessage
   }
}
