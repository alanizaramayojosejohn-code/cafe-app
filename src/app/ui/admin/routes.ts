import { Routes } from '@angular/router'

export const AdminRoutes: Routes = [
   {
      path: 'usuarios',
      loadComponent: async () => await import('./pages/users/container/component'),
   },
]
