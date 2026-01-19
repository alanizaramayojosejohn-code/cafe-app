import { Routes } from '@angular/router'

export const ChefRoutes: Routes = [
   {
      path: '',
      loadComponent: async () => await import('./pages/home/home.component'),
   },
]
