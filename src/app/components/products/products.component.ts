// import { Component, OnInit, signal, computed, inject, Injector,runInInjectionContext } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatCardModule } from '@angular/material/card';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatSelectModule } from '@angular/material/select';
// import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import { MatProgressBarModule } from '@angular/material/progress-bar';
// import { MatChipsModule } from '@angular/material/chips';
// import { ProductService } from '../../services/product/product.service';
// import { CategoryService } from '../../services/category/category.service';
// import { AuthService } from '../../services/auth.service';
// import {
//   Product,
//   CreateProductDto,
//   UpdateProductDto,
//   ProductType,
//   ProductStatus,
// } from '../../models/product.model';
// import { Category } from '../../models/category.model';

// @Component({
//   selector: 'app-products',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     MatButtonModule,
//     MatIconModule,
//     MatCardModule,
//     MatFormFieldModule,
//     MatInputModule,
//     MatSelectModule,
//     MatSnackBarModule,
//     MatProgressSpinnerModule,
//     MatProgressBarModule,
//     MatChipsModule,
//   ],
//   templateUrl: './products.component.html',
//   styleUrls: ['./products.component.css'],
// })
// export class ProductsComponent implements OnInit {
//   // 1. Usamos inject() para mayor compatibilidad con Angular 21
//   private injector = inject(Injector);
//   private productService = inject(ProductService);
//   private categoryService = inject(CategoryService);
//   private fb = inject(FormBuilder);
//   private snackBar = inject(MatSnackBar);
//   public authService = inject(AuthService);

//   products = signal<Product[]>([]);
//   categories = signal<Category[]>([]);
//   loading = signal(true);
//   showForm = signal(false);
//   editingProduct = signal<Product | null>(null);
//   filterType = signal<ProductType | 'all'>('all');
//   filterStatus = signal<ProductStatus | 'all'>('all');
//   uploadingImage = signal(false);
//   uploadingRecipe = signal(false);
//   imagePreview = signal<string | null>(null);

//   productForm: FormGroup;

//   constructor() {
//     this.productForm = this.createForm();
//   }

//   ngOnInit() {
//   // Aseguramos que el código asíncrono no pierda el contexto de Firebase
//   runInInjectionContext(this.injector, () => {
//     this.initializeData();
//   });
// }
//   private async initializeData() {
//   try {
//     const exist = await this.categoryService.categoriesExist();
//     if (!exist) {
//       await this.categoryService.seedCategories();
//     }

//     // Al llamar a estos métodos aquí, heredan el contexto de inyección
//     this.loadCategories();
//     this.loadProducts();
//   } catch (error) {
//     console.error('Error inicializando:', error);
//   }
// }

//   private loadCategories() {
//     // Es vital que el subscribe ocurra en el flujo de Angular
//     this.categoryService.getAllCategories().subscribe({
//       next: (categories) => this.categories.set(categories),
//       error: (error) => {
//         console.error('Error al cargar categorías:', error);
//         this.showMessage('Error al cargar categorías', 'error');
//       },
//     });
//   }

//   loadProducts() {
//     this.loading.set(true);
//     this.productService.getAllProducts().subscribe({
//       next: (products) => {
//         this.products.set(products);
//         this.loading.set(false);
//       },
//       error: (error) => {
//         console.error('Error al cargar productos:', error);
//         this.showMessage('Error al cargar productos', 'error');
//         this.loading.set(false);
//       },
//     });
//   }

//   filteredProducts = computed(() => {
//     let filtered = this.products();

//     if (this.filterType() !== 'all') {
//       filtered = filtered.filter((p) => p.type === this.filterType());
//     }

//     if (this.filterStatus() !== 'all') {
//       filtered = filtered.filter((p) => p.status === this.filterStatus());
//     }

//     return filtered;
//   });

//   stats = computed(() => {
//     const prods = this.products();
//     return {
//       total: prods.length,
//       activos: prods.filter((p) => p.status === 'activo').length,
//       inactivos: prods.filter((p) => p.status === 'inactivo').length,
//       comestibles: prods.filter((p) => p.type === 'comestible').length,
//       noComestibles: prods.filter((p) => p.type === 'nocomestible').length,
//     };
//   });

//   selectedImageFile: File | null = null;
//   selectedRecipeFile: File | null = null;

//   productTypes: ProductType[] = ['comestible', 'nocomestible'];
//   productStatuses: ProductStatus[] = ['activo', 'inactivo'];

//   /**
//    * Inicializa las categorías si no existen
//    */
//   private async checkAndSeedCategories() {
//     // Al estar dentro de un método de clase que ya inyectó el servicio,
//     // el contexto debería mantenerse mejor.
//     try {
//       const exist = await this.categoryService.categoriesExist();
//       if (!exist) {
//         await this.categoryService.seedCategories();
//       }
//     } catch (error) {
//       console.error('Error al inicializar categorías:', error);
//     }
//   }

//   private createForm(): FormGroup {
//     return this.fb.group({
//       pokename: [''],
//       name: ['', [Validators.required, Validators.minLength(3)]],
//       description: ['', [Validators.required, Validators.minLength(10)]],
//       price: [0, [Validators.required, Validators.min(0)]],
//       type: ['comestible' as ProductType, Validators.required],
//       status: ['activo' as ProductStatus, Validators.required],
//       categoryId: ['', Validators.required],
//     });
//   }

//   toggleForm() {
//     this.showForm.set(!this.showForm());
//     if (!this.showForm()) {
//       this.resetForm();
//     }
//   }

//   resetForm() {
//     this.productForm.reset({
//       pokename: '',
//       name: '',
//       description: '',
//       price: 0,
//       type: 'comestible',
//       status: 'activo',
//       categoryId: '',
//     });
//     this.editingProduct.set(null);
//     this.selectedImageFile = null;
//     this.selectedRecipeFile = null;
//     this.imagePreview.set(null);
//   }

//   onImageSelected(event: Event) {
//     const input = event.target as HTMLInputElement;
//     if (input.files && input.files[0]) {
//       this.selectedImageFile = input.files[0];

//       const reader = new FileReader();
//       reader.onload = (e) => {
//         this.imagePreview.set(e.target?.result as string);
//       };
//       reader.readAsDataURL(this.selectedImageFile);
//     }
//   }

//   onRecipeSelected(event: Event) {
//     const input = event.target as HTMLInputElement;
//     if (input.files && input.files[0]) {
//       this.selectedRecipeFile = input.files[0];
//     }
//   }

//   async onSubmit() {
//     if (this.productForm.invalid) {
//       this.productForm.markAllAsTouched();
//       this.showMessage('Por favor completa todos los campos requeridos', 'warning');
//       return;
//     }

//     this.loading.set(true);

//     try {
//       const formValue = this.productForm.value;

//       if (this.editingProduct()) {
//         const updateDto: UpdateProductDto = this.buildUpdateDto(formValue);
//         await this.productService.updateProduct(this.editingProduct()!.id!, updateDto);

//         const productId = this.editingProduct()!.id!;

//         if (this.selectedImageFile) {
//           this.uploadingImage.set(true);
//           await this.productService.uploadProductImage(productId, this.selectedImageFile);
//           this.uploadingImage.set(false);
//         }

//         if (this.selectedRecipeFile && formValue.type === 'comestible') {
//           this.uploadingRecipe.set(true);
//           await this.productService.uploadProductRecipe(productId, this.selectedRecipeFile);
//           this.uploadingRecipe.set(false);
//         }

//         this.showMessage('✅ Producto actualizado exitosamente', 'success');
//       } else {
//         const createDto: CreateProductDto = this.buildCreateDto(formValue);
//         const newId = await this.productService.createProduct(createDto);

//         if (this.selectedImageFile) {
//           this.uploadingImage.set(true);
//           await this.productService.uploadProductImage(newId, this.selectedImageFile);
//           this.uploadingImage.set(false);
//         }

//         if (this.selectedRecipeFile && formValue.type === 'comestible') {
//           this.uploadingRecipe.set(true);
//           await this.productService.uploadProductRecipe(newId, this.selectedRecipeFile);
//           this.uploadingRecipe.set(false);
//         }

//         this.showMessage(`✅ Producto creado exitosamente`, 'success');
//       }

//       this.resetForm();
//       this.showForm.set(false);
//     } catch (error: any) {
//       console.error('Error al guardar producto:', error);
//       this.showMessage(`❌ ${error.message}`, 'error');
//     } finally {
//       this.loading.set(false);
//       this.uploadingImage.set(false);
//       this.uploadingRecipe.set(false);
//     }
//   }

//   private buildCreateDto(formValue: any): CreateProductDto {
//     const dto: CreateProductDto = {
//       name: formValue.name.trim(),
//       description: formValue.description.trim(),
//       price: parseFloat(formValue.price),
//       type: formValue.type,
//       status: formValue.status,
//       categoryId: formValue.categoryId,
//     };

//     if (formValue.pokename?.trim()) {
//       dto.pokename = formValue.pokename.trim();
//     }

//     return dto;
//   }

//   private buildUpdateDto(formValue: any): UpdateProductDto {
//     const dto: UpdateProductDto = {};

//     if (formValue.pokename?.trim()) dto.pokename = formValue.pokename.trim();
//     if (formValue.name?.trim()) dto.name = formValue.name.trim();
//     if (formValue.description?.trim()) dto.description = formValue.description.trim();
//     if (formValue.price !== null && formValue.price !== undefined) {
//       dto.price = parseFloat(formValue.price);
//     }
//     if (formValue.type) dto.type = formValue.type;
//     if (formValue.status) dto.status = formValue.status;
//     if (formValue.categoryId) dto.categoryId = formValue.categoryId;

//     return dto;
//   }

//   editProduct(product: Product) {
//     this.editingProduct.set(product);
//     this.productForm.patchValue({
//       pokename: product.pokename || '',
//       name: product.name,
//       description: product.description,
//       price: product.price,
//       type: product.type,
//       status: product.status,
//       categoryId: product.categoryId,
//     });

//     if (product.imageUrl) {
//       this.imagePreview.set(product.imageUrl);
//     }

//     this.showForm.set(true);

//     setTimeout(() => {
//       window.scrollTo({ top: 0, behavior: 'smooth' });
//     }, 100);
//   }

//   async deleteProduct(product: Product) {
//     const confirmMessage = `¿Estás seguro de eliminar "${product.name}"?`;

//     if (!confirm(confirmMessage)) {
//       return;
//     }

//     this.loading.set(true);

//     try {
//       await this.productService.deleteProduct(product.id!);
//       this.showMessage('✅ Producto eliminado exitosamente', 'success');
//     } catch (error: any) {
//       console.error('Error al eliminar producto:', error);
//       this.showMessage(`❌ ${error.message}`, 'error');
//     } finally {
//       this.loading.set(false);
//     }
//   }

//   setFilterType(type: ProductType | 'all') {
//     this.filterType.set(type);
//   }

//   setFilterStatus(status: ProductStatus | 'all') {
//     this.filterStatus.set(status);
//   }

//   /**
//    * Obtiene el nombre de la categoría por su ID
//    */
//   getCategoryName(categoryId: string): string {
//     const category = this.categories().find((c) => c.id === categoryId);
//     return category?.name || 'Sin categoría';
//   }

//   showMessage(message: string, type: 'success' | 'error' | 'warning') {
//     this.snackBar.open(message, 'Cerrar', {
//       duration: 4000,
//       horizontalPosition: 'end',
//       verticalPosition: 'top',
//       panelClass: [`snackbar-${type}`],
//     });
//   }

//   getFormErrorMessage(fieldName: string): string {
//     const field = this.productForm.get(fieldName);

//     if (field?.hasError('required')) {
//       return 'Este campo es requerido';
//     }
//     if (field?.hasError('minlength')) {
//       const minLength = field.errors?.['minlength'].requiredLength;
//       return `Mínimo ${minLength} caracteres`;
//     }
//     if (field?.hasError('min')) {
//       return 'El valor debe ser mayor o igual a 0';
//     }

//     return '';
//   }

//   isComestible(): boolean {
//     return this.productForm.get('type')?.value === 'comestible';
//   }

//   clearImagePreview() {
//     this.imagePreview.set(null);
//     this.selectedImageFile = null;
//   }

//   clearRecipe() {
//     this.selectedRecipeFile = null;
//   }
// }
