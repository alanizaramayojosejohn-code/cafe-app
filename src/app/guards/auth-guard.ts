import { inject } from '@angular/core'
import { Router, CanActivateFn } from '@angular/router'
import { AuthService } from '../services/auth/auth.service'
import { map, take } from 'rxjs/operators'
import { UserRole } from '../models/user.model'

export const authGuard: CanActivateFn = (_route, state) => {
   const authService = inject(AuthService)
   const router = inject(Router)

   return authService.authReady$.pipe(
      take(1),
      map((user) => {
         if (user && user.isActive) return true
         router.navigate(['/log-in'], { queryParams: { returnUrl: state.url } })
         return false
      })
   )
}

export const noAuthGuard: CanActivateFn = () => {
   const authService = inject(AuthService)
   const router = inject(Router)

   return authService.authReady$.pipe(
      take(1),
      map((user) => {
         if (!user) return true
         router.navigateByUrl(authService.getHomeByRole(user.role))
         return false
      })
   )
}

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
   return (_route, state) => {
      const authService = inject(AuthService)
      const router = inject(Router)

      return authService.authReady$.pipe(
         take(1),
         map((user) => {
            if (!user || !user.isActive) {
               router.navigate(['/log-in'], { queryParams: { returnUrl: state.url } })
               return false
            }
            if (allowedRoles.includes(user.role)) return true
            router.navigateByUrl(authService.getHomeByRole(user.role))
            return false
         })
      )
   }
}
