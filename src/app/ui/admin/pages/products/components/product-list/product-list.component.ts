import { Component, inject, OnInit, output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ProductService } from '../../../../../../services/product/product.service'
import { CategoryService } from '../../../../../../services/category/category.service'
import { Product } from '../../../../../../models/product.model'
import { Category } from '../../../../../../models/category.model'
import { Observable } from 'rxjs'

@Component({
   selector: 'app-product-list',
   imports: [CommonModule],
   templateUrl: './product-list.component.html',
   styleUrl: './product-list.component.css',
   
})
export class ProductListComponent implements OnInit {
   private productService = inject(ProductService)
   private categoryService = inject(CategoryService)

   products$!: Observable<Product[]>
   categories$!: Observable<Category[]>
   selectedCategoryId: string | null = null

   createProduct = output<void>()
   editProduct = output<string>()
   viewDetail = output<string>()

   ngOnInit() {
      this.loadProducts()
      this.categories$ = this.categoryService.getCategories()
   }

   loadProducts() {
      if (this.selectedCategoryId) {
         this.products$ = this.productService.getProductsByCategory(this.selectedCategoryId)
      } else {
         this.products$ = this.productService.getProducts()
      }
   }

   filterByCategory(categoryId: string | null) {
      this.selectedCategoryId = categoryId
      this.loadProducts()
   }

   async deleteProduct(product: Product) {
      if (confirm(`¿Eliminar ${product.name}?`)) {
         await this.productService.deleteProduct(product.id!, product.imagePath, product.recipePath)
      }
   }

   onCreateProduct() {
      this.createProduct.emit()
   }

   onEditProduct(id: string) {
      this.editProduct.emit(id)
   }

   onViewDetail(id: string) {
      this.viewDetail.emit(id)
   }
}
