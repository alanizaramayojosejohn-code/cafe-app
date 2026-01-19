import { Component, inject, OnInit, output, input, signal, computed } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatButtonModule } from '@angular/material/button'
import { ProductService } from '../../../../../../services/product/product.service'
import { CategoryService } from '../../../../../../services/category/category.service'
import { Category } from '../../../../../../models/category.model'
import { Product, ProductType, ProductStatus } from '../../../../../../models/product.model'
import { Observable } from 'rxjs'

@Component({
   selector: 'app-product-form',
   standalone: true,
   imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
   templateUrl: './product-form.component.html',
   styleUrl: './product-form.component.css',
})
export class ProductFormComponent implements OnInit {
   private readonly fb = inject(FormBuilder)
   private readonly productService = inject(ProductService)
   private readonly categoryService = inject(CategoryService)
   private readonly router = inject(Router)
   private readonly route = inject(ActivatedRoute)

   readonly productId = input<string | null>(null)
   readonly isEditMode = input<boolean>(false)
   readonly cancel = output<void>()
   readonly saved = output<void>()

   readonly errorMessage = signal<string | null>(null)
   readonly imageError = signal<string | null>(null)
   readonly recipeError = signal<string | null>(null)
   readonly isSubmitting = signal<boolean>(false)
   readonly imageFile = signal<File | null>(null)
   readonly recipeFile = signal<File | null>(null)
   readonly currentProduct = signal<Product | null>(null)

   readonly hasErrors = computed(() => !!this.errorMessage() || !!this.imageError() || !!this.recipeError())

   readonly canSubmit = computed(() => this.productForm?.valid && !this.isSubmitting())

   productForm!: FormGroup

   categories$!: Observable<Category[]>

   readonly productTypes: ProductType[] = ['comestible', 'nocomestible']
   readonly productStatuses: ProductStatus[] = ['activo', 'inactivo']

   private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
   private readonly ALLOWED_RECIPE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
   private readonly MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

   ngOnInit(): void {
      this.categories$ = this.categoryService.getCategories()
      this.initForm()

      const productId = this.productId()
      if (productId) {
         this.loadProduct(productId)
      }
   }

   private initForm(): void {
      this.productForm = this.fb.group({
         pokename: ['', [Validators.required, Validators.minLength(3)]],
         name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(15)]],
         description: ['', Validators.required],
         price: [0, [Validators.required, Validators.min(1)]],
         type: ['comestible', Validators.required],
         status: ['activo', Validators.required],
         categoryId: ['', Validators.required],
         userId: ['user-default'],
      })
   }

   private loadProduct(id: string): void {
      this.productService.getProductById(id).subscribe((product) => {
         if (product) {
            this.currentProduct.set(product)
            this.productForm.patchValue(product)
         }
      })
   }

   onImageSelected(event: Event): void {
      const input = event.target as HTMLInputElement

      // Limpiar errores previos
      this.imageError.set(null)

      if (input.files?.[0]) {
         const file = input.files[0]

         if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
            this.imageError.set('Solo se permiten imágenes JPEG, PNG o WebP')
            this.imageFile.set(null)
            input.value = ''
            return
         }

         if (file.size > this.MAX_FILE_SIZE) {
            this.imageError.set(
               `La imagen es muy grande. Máximo: 5MB. Actual: ${(file.size / 1024 / 1024).toFixed(2)}MB`
            )
            this.imageFile.set(null)
            input.value = ''
            return
         }

         this.imageFile.set(file)
      }
   }

   onRecipeSelected(event: Event): void {
      const input = event.target as HTMLInputElement

      this.recipeError.set(null)

      if (input.files?.[0]) {
         const file = input.files[0]

         if (!this.ALLOWED_RECIPE_TYPES.includes(file.type)) {
            this.recipeError.set('Solo se permiten archivos PDF, JPEG, PNG o WebP')
            this.recipeFile.set(null)
            input.value = ''
            return
         }

         if (file.size > this.MAX_FILE_SIZE) {
            this.recipeError.set(
               `El archivo es muy grande. Máximo: 5MB. Actual: ${(file.size / 1024 / 1024).toFixed(2)}MB`
            )
            this.recipeFile.set(null)
            input.value = ''
            return
         }

         this.recipeFile.set(file)
      }
   }

   async onSubmit(): Promise<void> {
      if (this.productForm.invalid) {
         this.errorMessage.set('Por favor completa todos los campos requeridos')
         return
      }

      this.errorMessage.set(null)
      this.imageError.set(null)
      this.recipeError.set(null)
      this.isSubmitting.set(true)

      try {
         const imageFile = this.imageFile()
         const recipeFile = this.recipeFile()

         if (this.isEditMode() && this.productId()) {
            await this.productService.updateProduct(
               this.productId()!,
               this.productForm.value,
               imageFile ?? undefined,
               recipeFile ?? undefined
            )
         } else {
            await this.productService.addProduct(
               this.productForm.value,
               imageFile ?? undefined,
               recipeFile ?? undefined
            )
         }

         this.saved.emit()
      } catch (error) {
         this.handleError(error)
      } finally {
         this.isSubmitting.set(false)
      }
   }

   private handleError(error: unknown): void {
      console.error('Error al guardar producto:', error)

      const errorMsg =
         error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : 'Error desconocido al guardar el producto'

      const lowerMsg = errorMsg.toLowerCase()

      if (lowerMsg.includes('imagen') || lowerMsg.includes('formato no válido')) {
         this.imageError.set(errorMsg)
      } else if (lowerMsg.includes('receta') || lowerMsg.includes('pdf')) {
         this.recipeError.set(errorMsg)
      } else {
         this.errorMessage.set(errorMsg)
      }
   }

   onCancel(): void {
      this.cancel.emit()
   }
}
