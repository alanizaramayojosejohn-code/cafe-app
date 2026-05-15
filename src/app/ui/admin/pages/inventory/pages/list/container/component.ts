import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core'
import { Subscription } from 'rxjs'
import { Router } from '@angular/router'
import { ProductService } from '../../../../../../../services/product/product.service'
import { InventoryService } from '../../../../../../../services/inventory/inventory.service'
import { InventoryNoteService } from '../../../../../../../services/inventory/inventory-note.service'
import { Product } from '../../../../../../../models/product.model'
import { FileValidationService } from '../../../../../../../services/product/validation.service'
import { ImageCompressionService } from '../../../../../../../services/product/compression.service'
import { StorageService } from '../../../../../../../services/storage/storage.service'
import { ProductRepositoryService } from '../../../../../../../services/product/product-repository.service'

type InventoryFilter = 'all' | 'tracked' | 'low' | 'out' | 'untracked'

@Component({
   selector: 'app-inventory-list',
   imports: [],
   providers: [
      ProductService,
      FileValidationService,
      ImageCompressionService,
      StorageService,
      ProductRepositoryService,
   ],
   templateUrl: './component.html',
})
export default class InventoryListComponent implements OnInit, OnDestroy {
   private productService = inject(ProductService)
   private inventory = inject(InventoryService)
   private noteService = inject(InventoryNoteService)
   private router = inject(Router)

   products = signal<Product[]>([])
   loading = signal(true)
   filter = signal<InventoryFilter>('all')
   editingId = signal<string | null>(null)
   editingValue = signal<string>('')
   saving = signal(false)
   pendingNotesCount = signal(0)

   private sub?: Subscription
   private notesSub?: Subscription

   nocomestibles = computed(() => this.products().filter((p) => p.type === 'nocomestible'))

   filtered = computed(() => {
      const list = this.nocomestibles()
      switch (this.filter()) {
         case 'all':
            return list
         case 'tracked':
            return list.filter((p) => p.stock !== undefined && p.stock !== null)
         case 'untracked':
            return list.filter((p) => p.stock === undefined || p.stock === null)
         case 'low':
            return list.filter((p) => p.stock !== undefined && p.stock !== null && p.stock > 0 && p.stock < 5)
         case 'out':
            return list.filter((p) => p.stock === 0)
      }
   })

   counts = computed(() => {
      const list = this.nocomestibles()
      return {
         total: list.length,
         tracked: list.filter((p) => p.stock !== undefined && p.stock !== null).length,
         low: list.filter((p) => p.stock !== undefined && p.stock !== null && p.stock > 0 && p.stock < 5).length,
         out: list.filter((p) => p.stock === 0).length,
         untracked: list.filter((p) => p.stock === undefined || p.stock === null).length,
      }
   })

   ngOnInit() {
      this.sub = this.productService.getProducts().subscribe((products) => {
         this.products.set(products)
         this.loading.set(false)
      })
      this.notesSub = this.noteService.getPendingCount().subscribe((c) => this.pendingNotesCount.set(c))
   }

   ngOnDestroy() {
      this.sub?.unsubscribe()
      this.notesSub?.unsubscribe()
   }

   setFilter(f: InventoryFilter) {
      this.filter.set(f)
   }

   startEdit(product: Product) {
      this.editingId.set(product.id)
      this.editingValue.set(
         product.stock === undefined || product.stock === null ? '' : String(product.stock)
      )
   }

   cancelEdit() {
      this.editingId.set(null)
      this.editingValue.set('')
   }

   async saveEdit(product: Product) {
      const raw = this.editingValue().trim()
      if (raw === '') {
         alert('Ingresa un número de stock (0 o más)')
         return
      }
      const value = Number(raw)
      if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
         alert('El stock debe ser un entero ≥ 0')
         return
      }
      this.saving.set(true)
      try {
         await this.inventory.manualSetStock(product.id, value)
         this.cancelEdit()
      } catch (error) {
         console.error('Error al actualizar stock:', error)
         alert(error instanceof Error ? error.message : 'Error al actualizar el stock')
      } finally {
         this.saving.set(false)
      }
   }

   irNotas() {
      this.router.navigate(['/admin/inventario/notas'])
   }
}
