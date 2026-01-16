import { SignUpComponent } from './pages/auth/sign-up/sign-up.component'
import { Routes } from '@angular/router'

import { LogInComponent } from './pages/auth/log-in/log-in.component'
import { authGuard, noAuthGuard } from './guards/auth-guard'
import { ProductListComponent } from './components/product-list/product-list.component'
import { ProductFormComponent } from './components/product-form/product-form.component'
import { ProductDetailComponent } from './components/product-detail/product-detail.component'
import { ProductsComponent } from './components/products/products.component'
import { AdminRoutes } from './ui/admin/routes'
export const routes: Routes = [
   // www.coffe.com/
   // www.coffe.com/admin/
   {
      path: '',
      loadComponent: () => import('./pages/auth/sign-up/sign-up.component').then((m) => m.SignUpComponent),
   },
   {
      path: 'auth',
      children: [
         {
            path: 'log-in',
            component: LogInComponent,
            canActivate: [noAuthGuard], // Previene acceso si ya está autenticado
         },
         {
            path: 'sign-up',
            component: SignUpComponent,
            canActivate: [noAuthGuard], // Previene acceso si ya está autenticado
         },
      ],
   },

   {
      path: 'home',
      loadComponent: () => import('./pages/home/home.component').then((m) => m.Home),
      canActivate: [authGuard],
   },
   { path: 'products', component: ProductsComponent },
   { path: 'products', component: ProductListComponent },
   { path: 'products/new', component: ProductFormComponent },
   { path: 'products/edit/:id', component: ProductFormComponent },
   { path: 'products/:id', component: ProductDetailComponent },

   {
      path: 'admin',
      loadComponent: async () => await import('./ui/admin/container/component'),
      children: AdminRoutes,
   },
]
