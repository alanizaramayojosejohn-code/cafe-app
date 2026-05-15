import { Routes } from '@angular/router'
import { OrderRoutes } from './pages/order/routes'
import { SalesRoutes } from './pages/sales/routes'
import { InventoryRoutes } from './pages/inventory/routes'

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
      path: 'usuarios/:uid/pagos',
      loadComponent: async () =>
         await import('./pages/users/pages/payments/payments.component'),
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
      path: 'ventas',
      children: SalesRoutes,
   },
   {
      path: 'inventario',
      children: InventoryRoutes,
   },
   {
      path: 'sale',
      redirectTo: 'ventas',
      pathMatch: 'full',
   },
   {
      path: 'ordenes',
      loadComponent: async () => await import('./pages/order/container/component'),
      children: OrderRoutes,
   },
   {
      path: 'reportes',
      loadComponent: async () => await import('./pages/reports/container/component'),
   },
]
