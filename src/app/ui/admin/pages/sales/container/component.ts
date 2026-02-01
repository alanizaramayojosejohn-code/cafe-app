import { Component, inject, signal, computed, OnInit } from '@angular/core'
import { AsyncPipe } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ProductService } from '../../../../../services/product/product.service'
import { CategoryService } from '../../../../../services/category/category.service'
import { TableService } from '../../../../../services/order/table.service'
import { OrderService } from '../../../../../services/order/order.service'
import { Product } from '../../../../../models/product.model'
import { Category } from '../../../../../models/category.model'
import { Table } from '../../../../../models/table.model'
import { OrderItem } from '../../../../../models/order.model'
import { Observable } from 'rxjs'
import { FileValidationService } from '../../../../../services/product/validation.service'
import { ImageCompressionService } from '../../../../../services/product/compression.service'
import { StorageService } from '../../../../../services/storage/storage.service'
import { ProductRepositoryService } from '../../../../../services/product/product-repository.service'

@Component({
   selector: 'app-sales',
   imports: [AsyncPipe, FormsModule],
   providers: [
      ProductService,
      TableService,
      OrderService,
      CategoryService,
      FileValidationService,
      ImageCompressionService,
      StorageService,
      ProductRepositoryService,
   ],
   templateUrl: './component.html',
   styleUrl: './component.css',
})
export default class SalesComponent implements OnInit {
   private productService = inject(ProductService)
   private categoryService = inject(CategoryService)
   private tableService = inject(TableService)
   private orderService = inject(OrderService)

   products$!: Observable<Product[]>
   categories$!: Observable<Category[]>
   tables$!: Observable<Table[]>

   searchQuery = signal('')
   selectedTab = signal<'Comida' | 'Objetos'>('Comida')
   selectedTableId = signal<string>('')
   orderItems = signal<OrderItem[]>([])
   selectedCategoryId = signal<string>('')
   allProducts = signal<Product[]>([])
   allCategories = signal<Category[]>([])
   allTables = signal<Table[]>([])
   saving = signal(false)

   filteredProducts = computed(() => {
      const query = this.searchQuery().toLowerCase()
      const tab = this.selectedTab()
      const categoryId = this.selectedCategoryId()
      const products = this.allProducts()

      let filtered = products.filter((p) => {
         const matchesTab = tab === 'Comida' ? p.type === 'comestible' : p.type === 'nocomestible'

         if (!matchesTab) return false

         if (categoryId && p.categoryId !== categoryId) return false

         if (query) {
            const matchesName = p.name.toLowerCase().includes(query)
            const matchesPokename = p.pokename.toLowerCase().includes(query)
            const category = this.allCategories().find((c) => c.id === p.categoryId)
            const matchesCategory = category?.name.toLowerCase().includes(query)

            return matchesName || matchesPokename || matchesCategory
         }

         return true
      })

      return filtered
   })

   filteredCategories = computed(() => {
      const tab = this.selectedTab()
      const products = this.allProducts()
      const categories = this.allCategories()

      const categoryIds = new Set(
         products
            .filter((p) => (tab === 'Comida' ? p.type === 'comestible' : p.type === 'nocomestible'))
            .map((p) => p.categoryId)
      )

      return categories.filter((c) => c.id && categoryIds.has(c.id))
   })

   subtotal = computed(() => {
      return this.orderItems().reduce((sum, item) => sum + item.subtotal, 0)
   })

   total = computed(() => {
      return this.subtotal()
   })

   ngOnInit() {
      this.products$ = this.productService.getProducts()
      this.categories$ = this.categoryService.getCategories()
      this.tables$ = this.tableService.getTables()

      // Suscribirse para actualizar signals
      this.products$.subscribe((products) => {
         this.allProducts.set(products)
      })

      this.categories$.subscribe((categories) => {
         this.allCategories.set(categories)
      })

      this.tables$.subscribe((tables) => {
         this.allTables.set(tables)
      })
   }

   selectTab(tab: 'Comida' | 'Objetos') {
      this.selectedTab.set(tab)
      this.selectedCategoryId.set('')
   }

   selectCategory(categoryId: string) {
      this.selectedCategoryId.set(categoryId)
   }

   selectTable(tableId: string) {
      this.selectedTableId.set(tableId)
   }

   addProduct(product: Product) {
      const items = this.orderItems()
      const existingItem = items.find((item) => item.productId === product.id)

      if (existingItem) {
         const updatedItems = items.map((item) =>
            item.productId === product.id
               ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
               : item
         )
         this.orderItems.set(updatedItems)
      } else {
         const newItem: OrderItem = {
            productId: product.id,
            product: product,
            quantity: 1,
            price: product.price,
            subtotal: product.price,
         }
         this.orderItems.set([...items, newItem])
      }
   }

   removeProduct(productId: string) {
      const items = this.orderItems().filter((item) => item.productId !== productId)
      this.orderItems.set(items)
   }

   updateQuantity(productId: string, quantity: number) {
      if (quantity <= 0) {
         this.removeProduct(productId)
         return
      }

      const items = this.orderItems().map((item) =>
         item.productId === productId ? { ...item, quantity, subtotal: quantity * item.price } : item
      )
      this.orderItems.set(items)
   }

   async saveOrder() {
      const tableId = this.selectedTableId()
      if (!tableId) {
         alert('Por favor selecciona una mesa')
         return
      }

      const items = this.orderItems()
      if (items.length === 0) {
         alert('No hay productos en la orden')
         return
      }

      this.saving.set(true)
      try {
         const tables = this.allTables()
         const selectedTable = tables.find((t) => t.id === tableId)
         const tableName = selectedTable ? selectedTable.name : 'Mesa'

         await this.orderService.createOrder({
            tableId,
            tableName,
            items,
            subtotal: this.subtotal(),
            total: this.total(),
            status: 'pendiente',
         })

         this.orderItems.set([])
         this.selectedTableId.set('')
         alert('Orden guardada exitosamente')
      } catch (error) {
         console.error('Error al guardar la orden:', error)
         alert('Error al guardar la orden')
      } finally {
         this.saving.set(false)
      }
   }

   clearOrder() {
      if (confirm('¿Estás seguro de limpiar la orden?')) {
         this.orderItems.set([])
      }
   }
}
