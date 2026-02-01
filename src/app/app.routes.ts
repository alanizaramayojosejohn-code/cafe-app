import { Routes } from '@angular/router'
import { authGuard, noAuthGuard } from './guards/auth-guard'
import { AdminRoutes } from './ui/admin/routes'
import { PublicRoutes } from './ui/public/routes'
import { ChefRoutes } from './ui/chef/routes'

export const routes: Routes = [
   // www.coffe.com/
   // www.coffe.com/admin/
   {
      path: '',
      loadComponent: () => import('./ui/public/container/component'),
      children: PublicRoutes,
   },
   {
      path: 'admin',
      // canActivate: [roleGuard(['admin'])],
      loadComponent: async () => await import('./ui/admin/container/component'),
      children: AdminRoutes,
   },
   {
      path: 'caja',
      loadComponent: async () => await import('./ui/cashier/container/component'),
      children: AdminRoutes,
   },
   //  {
   //     path: 'public',
   //     loadComponent: async () => await import('./ui/public/container/component'),
   //     children: PublicRoutes,
   //  },
   {
      path: 'cocina',
      loadComponent: async () => await import('./ui/chef/container/component'),
      children: ChefRoutes,
   },
   
]
