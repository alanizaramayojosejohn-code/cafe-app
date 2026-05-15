import { Routes } from '@angular/router'

export const ChefRoutes: Routes = [
   {
      path: '',
      loadComponent: async () => await import('./pages/home/home.component'),
   },
   {
      path: 'historial',
      loadComponent: async () => await import('./pages/history/history.component'),
   },
   {
      path: 'notas',
      loadComponent: async () =>
         await import('../admin/pages/inventory/pages/notes/container/component'),
   },
]
