import { Component, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ProductListComponent } from '../components/product-list/product-list.component'
import { ProductFormComponent } from '../components/product-form/product-form.component'
import { ProductDetailComponent } from '../components/product-detail/product-detail.component'
import { ProductService } from '../../../../../services/product/product.service'
import { CategoryService } from '../../../../../services/category/category.service'

type View = 'list' | 'form' | 'detail'

@Component({
   selector: 'app-products',
   imports: [CommonModule, ProductListComponent, ProductFormComponent, ProductDetailComponent],
   providers: [ProductService, CategoryService],
   templateUrl: './products.component.html',
   styleUrl: './products.component.css',
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
