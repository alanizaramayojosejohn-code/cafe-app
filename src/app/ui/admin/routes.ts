import { Routes } from '@angular/router'
import { OrderRoutes } from './pages/order/routes'

export const AdminRoutes: Routes = [
   {
      path: '',
      loadComponent: async () => await import('./pages/home/home.component'),
   },
   {
      path: 'usuarios',
      loadComponent: async () => await import('./pages/users/container/component'),
   },
   {
      path: 'home',
      loadComponent: async () => await import('./pages/home/home.component'),
   },
   {
      path: 'productos',
      loadComponent: async () => await import('./pages/products/container/component'),
   },
   {
      path: 'tables',
      loadComponent: async () => import('./pages/sales/components/seed-tables.component'),
   },
   {
      path: 'sale',
      loadComponent: async () => import('./pages/sales/container/component'),
   },
   {
      path: 'usuarios',
      loadComponent: async () => await import('./pages/users/container/component'),
   },
   //  {
   //     path: 'orders',
   //     loadComponent: async () => import('./pages/sales/pages/order/container/component'),
   //  },
   //  {
   //     path: 'orders/:id/payment',
   //     loadComponent: async () => import('./pages/sales/pages/payment/container/component'),
   //  },

   {
      path: 'ordenes',
      loadComponent: async () => await import('./pages/order/container/component'),
      children: OrderRoutes,
   },
]
