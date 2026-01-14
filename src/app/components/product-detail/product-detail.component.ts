import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product/product.service';
import { CategoryService } from '../../services/category/category.service';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { Observable, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  product$!: Observable<Product | undefined>;
  category$!: Observable<Category | undefined>;

  ngOnInit() {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.product$ = this.productService.getProductById(productId);

      this.category$ = this.product$.pipe(
        switchMap(product => {
          if (product?.categoryId) {
            return this.categoryService.getCategories().pipe(
              switchMap(categories =>
                of(categories.find(c => c.id === product.categoryId))
              )
            );
          }
          return of(undefined);
        })
      );
    }
  }

  goBack() {
    this.router.navigate(['/products']);
  }

  editProduct(id: string) {
    this.router.navigate(['/products/edit', id]);
  }

  async deleteProduct(product: Product) {
    if (confirm(`¿Eliminar ${product.name}?`)) {
      await this.productService.deleteProduct(product.id!, product.imagePath, product.recipePath);
      this.router.navigate(['/products']);
    }
  }
}
