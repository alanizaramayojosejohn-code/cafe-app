import { Routes } from '@angular/router'
import { SalesRoutes } from '../admin/pages/sales/routes'

export const CashierRoutes: Routes = [
   {
      path: '',
      loadComponent: async () => await import('./pages/home/home.component'),
   },
   {
      path: 'ventas',
      children: SalesRoutes,
   },
   {
      path: 'nueva',
      redirectTo: 'ventas/nueva',
      pathMatch: 'full',
   },
   {
      path: 'ordenes',
      loadComponent: async () =>
         await import('../admin/pages/order/pages/list/container/component'),
   },
   {
      path: 'ordenes/:id/payment',
      loadComponent: async () =>
         await import('../admin/pages/order/pages/payment/container/component'),
   },
   {
      path: 'notas',
      loadComponent: async () =>
         await import('../admin/pages/inventory/pages/notes/container/component'),
   },
]
