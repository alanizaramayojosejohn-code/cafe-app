import { Component, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ProductListComponent } from '../components/product-list/container/list'
import { ProductFormComponent } from '../components/product-form/container/form'
import { ProductDetailComponent } from '../components/product-detail/container/detail'
import { ProductService } from '../../../../../services/product/product.service'
import { CategoryService } from '../../../../../services/category/category.service'
import { StorageService } from '../../../../../services/storage/storage.service'
import { ImageCompressionService } from '../../../../../services/product/compression.service'
import { FileValidationService } from '../../../../../services/product/validation.service'
import { ProductRepositoryService } from '../../../../../services/product/product-repository.service'

type View = 'list' | 'form' | 'detail'

@Component({
   selector: 'app-products',
   imports: [CommonModule, ProductListComponent, ProductFormComponent, ProductDetailComponent],
   providers: [
      ProductService,
      CategoryService,
      FileValidationService,
      ImageCompressionService,
      StorageService,
      ProductRepositoryService,
   ],
   templateUrl: './component.html',
   styleUrl: './component.css',
})
export default class ProductsComponent {
   currentView = signal<View>('list')
   selectedProductId = signal<string | null>(null)
   isEditMode = signal<boolean>(false)

   showList() {
      this.currentView.set('list')
      this.selectedProductId.set(null)
      this.isEditMode.set(false)
   }

   showForm(productId: string | null = null) {
      this.currentView.set('form')
      this.selectedProductId.set(productId)
      this.isEditMode.set(!!productId)
   }

   showDetail(productId: string) {
      this.currentView.set('detail')
      this.selectedProductId.set(productId)
   }
}
