import { Routes } from '@angular/router'

export const PublicRoutes: Routes = [
   {
      path: '',
      loadComponent: async () => await import('./pages/log-in/log-in.component'),
   },
   {
      path: 'log-in',
      loadComponent: async () => await import('./pages/log-in/log-in.component'),
   },
]
