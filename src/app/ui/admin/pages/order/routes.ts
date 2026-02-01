import { Routes } from '@angular/router'

export const OrderRoutes: Routes = [
   {
      path: '',
      loadComponent: async () => await import('./pages/list/container/component'),
   },
   {
      path: ':id/payment',
      loadComponent: async () => await import('./pages/payment/container/component'),
   },
]
