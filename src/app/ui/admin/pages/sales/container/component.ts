import { Component, inject, signal, computed, OnInit } from '@angular/core'
import { AsyncPipe, CurrencyPipe } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { firstValueFrom } from 'rxjs'
import { ProductService } from '../../../../../services/product/product.service'
import { CategoryService } from '../../../../../services/category/category.service'
import { TableService } from '../../../../../services/order/table.service'
import { OrderService } from '../../../../../services/order/order.service'
import { AuthService } from '../../../../../services/auth/auth.service'
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
   imports: [FormsModule, CurrencyPipe],
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
   private authService = inject(AuthService)
   private route = inject(ActivatedRoute)
   private router = inject(Router)

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
   editingId = signal<string | null>(null)
   loadingOrder = signal(false)
   private originalItems: OrderItem[] = []

   isEditing = computed(() => this.editingId() !== null)

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

   selectedTableLabel = computed(() => {
      const id = this.selectedTableId()
      if (!id) return ''
      const t = this.allTables().find((x) => x.id === id)
      if (!t) return ''
      return t.location ? `${t.name} · ${t.location}` : t.name
   })

   ngOnInit() {
      this.products$ = this.productService.getProducts()
      this.categories$ = this.categoryService.getCategories()
      this.tables$ = this.tableService.getTables()

      this.products$.subscribe((products) => {
         this.allProducts.set(products)
      })

      this.categories$.subscribe((categories) => {
         this.allCategories.set(categories)
      })

      this.tables$.subscribe((tables) => {
         this.allTables.set(tables)
      })

      const id = this.route.snapshot.paramMap.get('id')
      if (id) {
         this.editingId.set(id)
         this.loadOrderForEdit(id)
      }
   }

   private async loadOrderForEdit(id: string) {
      this.loadingOrder.set(true)
      try {
         const order = await firstValueFrom(this.orderService.getOrderById(id))
         if (!order) {
            alert('No se encontró la venta')
            this.goBackToList()
            return
         }
         if (order.status === 'cancelado') {
            alert('Esta venta está cancelada y no se puede editar')
            this.goBackToList()
            return
         }
         if (order.status === 'entregado') {
            alert('Esta venta ya fue entregada y no se puede editar')
            this.goBackToList()
            return
         }
         this.selectedTableId.set(order.tableId)
         this.originalItems = order.items.map((i) => ({ ...i }))
         this.orderItems.set(order.items.map((i) => ({ ...i })))
      } catch (error) {
         console.error('Error al cargar la venta:', error)
         alert('Error al cargar la venta')
         this.goBackToList()
      } finally {
         this.loadingOrder.set(false)
      }
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
      const nextQty = (existingItem?.quantity ?? 0) + 1

      if (!this.canSellQuantity(product, nextQty)) {
         alert(`Stock insuficiente de "${product.name}". Disponible: ${this.availableStock(product) ?? 0}.`)
         return
      }

      if (existingItem) {
         const updatedItems = items.map((item) =>
            item.productId === product.id
               ? { ...item, quantity: nextQty, subtotal: nextQty * item.price }
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

   /**
    * Stock disponible para vender = stock guardado del producto
    * + cantidad que ya estaba en la orden original (en modo edición, esa cantidad
    * ya fue descontada al crear la orden, así que está "reservada" para nosotros).
    */
   availableStock(product: Product): number | null {
      if (product.type !== 'nocomestible') return null
      if (product.stock === undefined || product.stock === null) return null
      const reservedByOriginal =
         this.originalItems.find((i) => i.productId === product.id)?.quantity ?? 0
      return product.stock + reservedByOriginal
   }

   private canSellQuantity(product: Product, qty: number): boolean {
      const available = this.availableStock(product)
      if (available === null) return true
      return qty <= available
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

      const items = this.orderItems()
      const target = items.find((i) => i.productId === productId)
      if (target && !this.canSellQuantity(target.product, quantity)) {
         alert(
            `Stock insuficiente de "${target.product.name}". Disponible: ${
               this.availableStock(target.product) ?? 0
            }.`
         )
         return
      }

      this.orderItems.set(
         items.map((item) =>
            item.productId === productId ? { ...item, quantity, subtotal: quantity * item.price } : item
         )
      )
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

         const editingId = this.editingId()
         if (editingId) {
            await this.orderService.updateOrderItems(editingId, this.originalItems, {
               tableId,
               tableName,
               items,
               subtotal: this.subtotal(),
               total: this.total(),
            })
            alert('Venta actualizada exitosamente')
            this.goBackToList()
         } else {
            const uid = this.authService.getCurrentUser()?.uid
            await this.orderService.createOrder({
               tableId,
               tableName,
               items,
               subtotal: this.subtotal(),
               total: this.total(),
               status: 'pendiente',
               ...(uid ? { userId: uid } : {}),
            })

            this.orderItems.set([])
            this.selectedTableId.set('')
            alert('Venta guardada exitosamente')
            this.goBackToList()
         }
      } catch (error) {
         console.error('Error al guardar la venta:', error)
         const msg = error instanceof Error ? error.message : 'Error al guardar la venta'
         alert(msg)
      } finally {
         this.saving.set(false)
      }
   }

   clearOrder() {
      if (confirm('¿Estás seguro de limpiar la orden?')) {
         this.orderItems.set([])
      }
   }

   goBackToList() {
      const id = this.editingId()
      if (id) {
         this.router.navigate(['../..'], { relativeTo: this.route })
      } else {
         this.router.navigate(['..'], { relativeTo: this.route })
      }
   }
}
