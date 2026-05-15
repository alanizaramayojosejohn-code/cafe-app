import { Injectable, signal, inject } from '@angular/core'
import {
   Auth,
   signInWithEmailAndPassword,
   signInWithPopup,
   GoogleAuthProvider,
   signOut,
   authState,
   deleteUser,
   sendPasswordResetEmail,
   User as FirebaseUser,
} from '@angular/fire/auth'
import { Observable, ReplaySubject } from 'rxjs'
import { Router } from '@angular/router'
import { UserService } from './../user/user.service'
import { AppUser, UserRole } from '../../models/user.model'

const UNAUTHORIZED_MESSAGE =
   'No estás autorizado. Pide al administrador que te registre antes de iniciar sesión.'
const DEACTIVATED_MESSAGE = 'Cuenta desactivada. Contacta al administrador.'

@Injectable({
   providedIn: 'root',
})
export class AuthService {
   private auth = inject(Auth)
   private router = inject(Router)
   private userService = inject(UserService)

   user$: Observable<FirebaseUser | null>
   currentUser = signal<FirebaseUser | null>(null)
   userData = signal<AppUser | null>(null)
   currentRole = signal<UserRole | null>(null)

   private userDataReady = new ReplaySubject<AppUser | null>(1)
   authReady$: Observable<AppUser | null> = this.userDataReady.asObservable()

   constructor() {
      this.user$ = authState(this.auth)

      this.user$.subscribe(async (firebaseUser) => {
         this.currentUser.set(firebaseUser)

         if (firebaseUser) {
            await this.loadUserData(firebaseUser.uid)
         } else {
            this.userData.set(null)
            this.currentRole.set(null)
            this.userDataReady.next(null)
         }
      })
   }

   private async loadUserData(uid: string): Promise<AppUser | null> {
      try {
         const user = await this.userService.getUserByUid(uid)
         this.userData.set(user)
         this.currentRole.set(user?.role ?? null)
         this.userDataReady.next(user)
         return user
      } catch (error) {
         console.error('Error loading user data:', error)
         this.userDataReady.next(null)
         return null
      }
   }

   private async provisionAndLoad(credentialUser: FirebaseUser, fallbackName: string): Promise<AppUser> {
      const provisioned = await this.userService.provisionUser(
         credentialUser.uid,
         credentialUser.email!,
         credentialUser.displayName || fallbackName
      )

      if (!provisioned) {
         await this.rejectUnauthorized(credentialUser)
         throw UNAUTHORIZED_MESSAGE
      }

      if (!provisioned.isActive) {
         await this.rejectUnauthorized(credentialUser, false)
         throw DEACTIVATED_MESSAGE
      }

      this.userData.set(provisioned)
      this.currentRole.set(provisioned.role)
      this.userDataReady.next(provisioned)
      return provisioned
   }

   private async rejectUnauthorized(user: FirebaseUser, removeAuthAccount = true) {
      if (removeAuthAccount) {
         try {
            await deleteUser(user)
         } catch {
            /* fallback to signOut if delete fails */
         }
      }
      try {
         await signOut(this.auth)
      } catch {
         /* ignore */
      }
      this.userData.set(null)
      this.currentRole.set(null)
      this.userDataReady.next(null)
   }

   async loginWithEmail(email: string, password: string) {
      try {
         const credential = await signInWithEmailAndPassword(this.auth, email, password)
         await this.provisionAndLoad(credential.user, 'Usuario')
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
         await this.provisionAndLoad(credential.user, 'Usuario')
         return credential
      } catch (error: any) {
         throw this.handleError(error)
      }
   }

   async sendPasswordReset(email: string) {
      try {
         await sendPasswordResetEmail(this.auth, email)
      } catch (error: any) {
         throw this.handleError(error)
      }
   }

   async logout() {
      try {
         await signOut(this.auth)
         this.userData.set(null)
         this.currentRole.set(null)
         this.router.navigate(['/log-in'])
      } catch (error: any) {
         throw this.handleError(error)
      }
   }

   getCurrentUser(): FirebaseUser | null {
      return this.auth.currentUser
   }

   isAuthenticated(): boolean {
      return this.currentUser() !== null
   }

   hasRole(role: UserRole): boolean {
      return this.currentRole() === role
   }

   isAdmin(): boolean {
      return this.currentRole() === 'admin'
   }

   hasAnyRole(roles: UserRole[]): boolean {
      const currentRole = this.currentRole()
      return currentRole ? roles.includes(currentRole) : false
   }

   getHomeByRole(role: UserRole | null | undefined): string {
      switch (role) {
         case 'admin':
            return '/admin'
         case 'cajero':
            return '/caja'
         case 'cocinero':
            return '/cocina'
         default:
            return '/log-in'
      }
   }

   async redirectByRole(fallback?: string): Promise<boolean> {
      const role = this.currentRole()
      const target = role ? this.getHomeByRole(role) : (fallback ?? '/log-in')
      return this.router.navigateByUrl(target)
   }

   private handleError(error: any): string {
      if (typeof error === 'string') return error

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
            errorMessage = error.message ?? errorMessage
      }

      return errorMessage
   }
}
