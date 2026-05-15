import { Routes } from '@angular/router'
import { authGuard, noAuthGuard, roleGuard } from './guards/auth-guard'
import { AdminRoutes } from './ui/admin/routes'
import { PublicRoutes } from './ui/public/routes'
import { ChefRoutes } from './ui/chef/routes'
import { CashierRoutes } from './ui/cashier/routes'

export const routes: Routes = [
   {
      path: '',
      canActivate: [noAuthGuard],
      loadComponent: () => import('./ui/public/container/component'),
      children: PublicRoutes,
   },
   {
      path: 'admin',
      canActivate: [authGuard, roleGuard(['admin'])],
      loadComponent: async () => await import('./ui/admin/container/component'),
      children: AdminRoutes,
   },
   {
      path: 'caja',
      canActivate: [authGuard, roleGuard(['cajero', 'admin'])],
      loadComponent: async () => await import('./ui/cashier/container/component'),
      children: CashierRoutes,
   },
   {
      path: 'cocina',
      canActivate: [authGuard, roleGuard(['cocinero', 'admin'])],
      loadComponent: async () => await import('./ui/chef/container/component'),
      children: ChefRoutes,
   },
]
