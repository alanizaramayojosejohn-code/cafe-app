import { Component, inject, OnInit, output, input, signal, computed, DestroyRef } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { CommonModule } from '@angular/common'
import {
   AbstractControl,
   AsyncValidatorFn,
   FormBuilder,
   FormGroup,
   ReactiveFormsModule,
   ValidationErrors,
   Validators,
} from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatButtonModule } from '@angular/material/button'
import { ProductService } from '../../../../../../../services/product/product.service'
import { CategoryService } from '../../../../../../../services/category/category.service'
import { FileValidationService } from '../../../../../../../services/product/validation.service'
import { Category } from '../../../../../../../models/category.model'
import { Product, ProductType, ProductStatus } from '../../../../../../../models/product.model'
import { catchError, debounceTime, distinctUntilChanged, map, Observable, of, switchMap } from 'rxjs'
import { ImageCompressionService } from '../../../../../../../services/product/compression.service'
import { StorageService } from '../../../../../../../services/storage/storage.service'

@Component({
   selector: 'app-product-form',
   imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
   providers: [ProductService, CategoryService, FileValidationService, ImageCompressionService, StorageService],
   templateUrl: './form.html',
   styleUrl: './form.css',
})
export class ProductFormComponent implements OnInit {
   private readonly fb = inject(FormBuilder)
   private readonly productService = inject(ProductService)
   private readonly categoryService = inject(CategoryService)
   private readonly fileValidationService = inject(FileValidationService)
   private readonly destroyRef = inject(DestroyRef)

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
   readonly imagePreviewUrl = signal<string | null>(null)
   readonly formValid = signal<boolean>(false)

   readonly hasErrors = computed(() => !!(this.errorMessage() || this.imageError() || this.recipeError()))

   readonly canSubmit = computed(() => this.formValid() && !this.isSubmitting())

   readonly submitButtonText = computed(() => {
      if (this.isSubmitting()) return 'Guardando...'
      return this.isEditMode() ? 'Actualizar Producto' : 'Crear Producto'
   })

   productForm!: FormGroup

   categories$!: Observable<Category[]>

   readonly productTypes: readonly ProductType[] = ['comestible', 'nocomestible'] as const
   readonly productStatuses: readonly ProductStatus[] = ['activo', 'inactivo'] as const

   ngOnInit(): void {
      this.initializeComponent()
   }

   private initializeComponent(): void {
      this.categories$ = this.categoryService.getCategories()
      this.initForm()
      this.loadProductIfEditMode()
   }

   private initForm(): void {
      this.productForm = this.fb.group({
         pokename: ['', [Validators.required, Validators.minLength(3)], [this.pokenameAsyncValidator()]],
         name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(15)]],
         description: ['', Validators.required],
         price: [0, [Validators.required, Validators.min(1)]],
         type: ['comestible' as ProductType, Validators.required],
         status: ['activo' as ProductStatus, Validators.required],
         categoryId: ['', Validators.required],
         userId: ['user-default'],
      })

      this.FormValueChanges()
   }

   private FormValueChanges(): void {
      this.productForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
         if (this.errorMessage()) {
            this.errorMessage.set(null)
         }
      })

      this.productForm.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
         this.formValid.set(this.productForm.valid)
      })
   }

   private pokenameAsyncValidator(): AsyncValidatorFn {
      return (control: AbstractControl): Observable<ValidationErrors | null> => {
         const value = control.value?.trim()

         if (!value || value.length < 3) {
            return of(null)
         }

         return of(value).pipe(
            debounceTime(500),
            distinctUntilChanged(),
            switchMap((pokename) => {
               const excludeId = this.productId() || undefined
               return this.productService.checkPokenameExist$(pokename, excludeId).pipe(
                  map((exists) => (exists ? { pokenameExists: true } : null)),
                  catchError((error) => {
                     console.error('Error validando pokename:', error)
                     return of(null)
                  })
               )
            }),
            takeUntilDestroyed(this.destroyRef)
         )
      }
   }

   private loadProductIfEditMode(): void {
      const productId = this.productId()
      if (productId && this.isEditMode()) {
         this.loadProduct(productId)
      }
   }

   private loadProduct(id: string): void {
      this.productService
         .getProductById(id)
         .pipe(takeUntilDestroyed(this.destroyRef))
         .subscribe({
            next: (product) => {
               if (product) {
                  this.currentProduct.set(product)
                  this.productForm.patchValue(product)

                  if (product.imageUrl) {
                     this.imagePreviewUrl.set(product.imageUrl)
                  }
               }
            },
            error: (error) => {
               console.error('Error cargando producto:', error)
               this.errorMessage.set('Error al cargar el producto')
            },
         })
   }

   onImageSelected(event: Event): void {
      const input = event.target as HTMLInputElement
      this.imageError.set(null)

      const file = input.files?.[0]
      if (!file) {
         this.clearImageSelection()
         return
      }

      try {
         this.fileValidationService.validateImage(file)
         this.imageFile.set(file)
         this.createImagePreview(file)
      } catch (error) {
         this.handleFileValidationError(error, 'imagen', input)
      }
   }

   onRecipeSelected(event: Event): void {
      const input = event.target as HTMLInputElement
      this.recipeError.set(null)

      const file = input.files?.[0]
      if (!file) {
         this.clearRecipeSelection()
         return
      }

      try {
         this.fileValidationService.validateRecipe(file)
         this.recipeFile.set(file)
      } catch (error) {
         this.handleFileValidationError(error, 'receta', input)
      }
   }

   private createImagePreview(file: File): void {
      const reader = new FileReader()
      reader.onload = (e) => {
         this.imagePreviewUrl.set(e.target?.result as string)
      }
      reader.onerror = () => {
         this.imageError.set('Error al cargar la vista previa de la imagen')
         this.clearImageSelection()
      }
      reader.readAsDataURL(file)
   }

   private handleFileValidationError(error: unknown, fileType: 'imagen' | 'receta', input: HTMLInputElement): void {
      const errorMessage = error instanceof Error ? error.message : `Error al validar ${fileType}`

      if (fileType === 'imagen') {
         this.imageError.set(errorMessage)
         this.clearImageSelection()
      } else {
         this.recipeError.set(errorMessage)
         this.clearRecipeSelection()
      }

      input.value = ''
   }

   private clearImageSelection(): void {
      this.imageFile.set(null)
      if (!this.currentProduct()?.imageUrl) {
         this.imagePreviewUrl.set(null)
      }
   }

   private clearRecipeSelection(): void {
      this.recipeFile.set(null)
   }

   async onSubmit(): Promise<void> {
      if (!this.validateForm()) {
         return
      }

      this.resetErrors()
      this.isSubmitting.set(true)

      try {
         await this.saveProduct()
         this.saved.emit()
      } catch (error) {
         this.handleSaveError(error)
      } finally {
         this.isSubmitting.set(false)
      }
   }

   private validateForm(): boolean {
      if (this.productForm.invalid) {
         this.productForm.markAllAsTouched()
         this.errorMessage.set('Por favor completa todos los campos requeridos correctamente')
         return false
      }
      return true
   }

   private resetErrors(): void {
      this.errorMessage.set(null)
      this.imageError.set(null)
      this.recipeError.set(null)
   }

   private async saveProduct() {
      const formValue = this.productForm.value
      const imageFile = this.imageFile() ?? undefined
      const recipeFile = this.recipeFile() ?? undefined

      if (this.isEditMode() && this.productId()) {
         const currentProduct = this.currentProduct()
         const updates = {
            ...formValue,
            imagePath: currentProduct?.imagePath,
            recipePath: currentProduct?.recipePath,
         }

         await this.productService.updateProduct(this.productId()!, updates, imageFile, recipeFile)
      } else {
         await this.productService.addProduct(formValue, imageFile, recipeFile)
      }
   }

   private handleSaveError(error: unknown): void {
      console.error('Error al guardar producto:', error)

      const errorMsg = this.extractErrorMessage(error)
      const errorType = this.categorizeError(errorMsg)

      switch (errorType) {
         case 'pokename':
            this.errorMessage.set(errorMsg)
            this.productForm.get('pokename')?.setErrors({ serverError: true })
            break
         case 'image':
            this.imageError.set(errorMsg)
            break
         case 'recipe':
            this.recipeError.set(errorMsg)
            break
         default:
            this.errorMessage.set(errorMsg)
      }
   }

   private extractErrorMessage(error: unknown): string {
      if (error instanceof Error) return error.message
      if (typeof error === 'string') return error
      return 'Error desconocido al guardar el producto'
   }

   private categorizeError(errorMsg: string): 'pokename' | 'image' | 'recipe' | 'general' {
      const lowerMsg = errorMsg.toLowerCase()

      if (lowerMsg.includes('pokename') && lowerMsg.includes('uso')) return 'pokename'
      if (lowerMsg.includes('imagen') || lowerMsg.includes('formato de imagen')) return 'image'
      if (lowerMsg.includes('receta') || lowerMsg.includes('pdf')) return 'recipe'
      return 'general'
   }

   onCancel(): void {
      if (this.isSubmitting()) return
      this.cancel.emit()
   }

   getFieldError(fieldName: string): string | null {
      const field = this.productForm.get(fieldName)
      if (!field || !field.errors || !field.touched) return null

      const errors = field.errors
      if (errors['required']) return 'Campo requerido'
      if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`
      if (errors['maxlength']) return `Máximo ${errors['maxlength'].requiredLength} caracteres`
      if (errors['min']) return `Debe ser mayor a ${errors['min'].min}`
      if (errors['pokenameExists']) return 'Este pokename ya está en uso'

      return 'Error de validación'
   }

   hasFieldError(fieldName: string): boolean {
      const field = this.productForm.get(fieldName)
      return !!(field?.invalid && field?.touched)
   }
}
