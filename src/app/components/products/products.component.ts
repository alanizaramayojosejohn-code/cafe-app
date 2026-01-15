import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductListComponent } from '../product-list/product-list.component';
import { ProductFormComponent } from '../product-form/product-form.component';
import { ProductDetailComponent } from '../product-detail/product-detail.component';
import { NavbarComponent } from '../nav-bar/nav-bar';

type View = 'list' | 'form' | 'detail';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ProductListComponent, ProductFormComponent, NavbarComponent, ProductDetailComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
})
export class ProductsComponent {
  currentView = signal<View>('list');
  selectedProductId = signal<string | null>(null);
  isEditMode = signal<boolean>(false);

  showList() {
    this.currentView.set('list');
    this.selectedProductId.set(null);
    this.isEditMode.set(false);
  }

  showForm(productId: string | null = null) {
    this.currentView.set('form');
    this.selectedProductId.set(productId);
    this.isEditMode.set(!!productId);
  }

  showDetail(productId: string) {
    this.currentView.set('detail');
    this.selectedProductId.set(productId);
  }
}
