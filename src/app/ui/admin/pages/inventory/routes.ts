import { Routes } from '@angular/router'

export const InventoryRoutes: Routes = [
   {
      path: '',
      loadComponent: async () => await import('./pages/list/container/component'),
   },
   {
      path: 'notas',
      loadComponent: async () => await import('./pages/notes/container/component'),
   },
]
