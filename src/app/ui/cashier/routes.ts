import { Routes } from '@angular/router'

export const CashierRoutes: Routes = [
   {
      path: '',
      loadComponent: async () => await import('./pages/home/home.component'),
      
   },
]
