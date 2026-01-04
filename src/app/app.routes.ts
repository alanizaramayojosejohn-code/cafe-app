import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/categories-realtime', pathMatch: 'full' },
  {
    path: 'categories-realtime',
    loadComponent: () =>
      import('./components/categories/categories').then((m) => m.CategoriesComponent),
  },
  {
    path: 'categories-firestore',
    loadComponent: () =>
      import('./components/categories-firestore/categories-firestore').then(
        (m) => m.CategoriesFirestoreComponent
      ),
  },
];
