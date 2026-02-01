import { Component, inject, signal } from '@angular/core'
import { TableService } from '../../../../../services/order/table.service'
import { StorageService } from '../../../../../services/storage/storage.service'
import { ImageCompressionService } from '../../../../../services/product/compression.service'
import { FileValidationService } from '../../../../../services/product/validation.service'
import { CategoryService } from '../../../../../services/category/category.service'
import { ProductService } from '../../../../../services/product/product.service'
import { Table } from '../../../../../models/table.model'


@Component({
   selector: 'app-seed-tables',

   providers: [
      ProductService,
      TableService,
      CategoryService,
      FileValidationService,
      ImageCompressionService,
      StorageService,
   ],
   template: `
      <div class="p-8">
         <h2 class="text-2xl font-bold mb-4">Inicializar Base de Datos</h2>

         <button
            (click)="seedTables()"
            [disabled]="loading()"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
         >
            @if (loading()) {
               Cargando...
            } @else {
               Crear Mesas
            }
         </button>

         @if (message()) {
            <div class="mt-4 p-4 rounded-lg" [class.bg-green-100]="success()" [class.bg-red-100]="!success()">
               <p [class.text-green-800]="success()" [class.text-red-800]="!success()">
                  {{ message() }}
               </p>
            </div>
         }
      </div>
   `,
})
export default class SeedTablesComponent {
   private tableService = inject(TableService)

   loading = signal(false)
   message = signal('')
   success = signal(false)

   async seedTables() {
      this.loading.set(true)
      this.message.set('')

      try {
         await this.tableService.seedTables()
         this.success.set(true)
         this.message.set('Mesas creadas exitosamente')
      } catch (error) {
         this.success.set(false)
         this.message.set('Error al crear las mesas: ' + error)
         console.error('Error seeding tables:', error)
      } finally {
         this.loading.set(false)
      }
   }
}
