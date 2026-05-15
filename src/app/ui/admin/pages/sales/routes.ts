import { Routes } from '@angular/router'

export const SalesRoutes: Routes = [
   {
      path: '',
      loadComponent: async () => await import('./pages/list/container/component'),
   },
   {
      path: 'nueva',
      loadComponent: async () => await import('./container/component'),
   },
   {
      path: ':id',
      loadComponent: async () => await import('./pages/detail/container/component'),
   },
   {
      path: ':id/editar',
      loadComponent: async () => await import('./container/component'),
   },
]
