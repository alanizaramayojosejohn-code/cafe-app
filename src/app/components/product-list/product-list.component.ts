import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product/product.service';
import { CategoryService } from '../../services/category/category.service';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);

  products$!: Observable<Product[]>;
  categories$!: Observable<Category[]>;
  selectedCategoryId: string | null = null;

  ngOnInit() {
    this.loadProducts();
    this.categories$ = this.categoryService.getCategories();
    // this.seedCategoriesOnce();
  }

  loadProducts() {
    if (this.selectedCategoryId) {
      this.products$ = this.productService.getProductsByCategory(this.selectedCategoryId);
    } else {
      this.products$ = this.productService.getProducts();
    }
  }

  filterByCategory(categoryId: string | null) {
    this.selectedCategoryId = categoryId;
    this.loadProducts();
  }

  createProduct() {
    this.router.navigate(['/products/new']);
  }

  editProduct(id: string) {
    this.router.navigate(['/products/edit', id]);
  }

  async deleteProduct(product: Product) {
    if (confirm(`¿Eliminar ${product.name}?`)) {
      await this.productService.deleteProduct(product.id!, product.imagePath, product.recipePath);
    }
  }
  // async seedCategoriesOnce() {
  //   await this.categoryService.seedCategories();
  //   console.log('✅ Categorías cargadas');
  // }
}
