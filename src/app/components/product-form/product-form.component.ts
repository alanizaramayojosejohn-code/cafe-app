import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ProductService } from '../../services/product/product.service';
import { CategoryService } from '../../services/category/category.service';
import { Category } from '../../models/category.model';
import { Product, ProductType, ProductStatus } from '../../models/product.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css',
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  productForm!: FormGroup;
  categories$!: Observable<Category[]>;
  isEditMode = false;
  productId: string | null = null;
  imageFile: File | null = null;
  recipeFile: File | null = null;
  currentProduct: Product | null = null;

  productTypes: ProductType[] = ['comestible', 'nocomestible'];
  productStatuses: ProductStatus[] = ['activo', 'inactivo'];

  ngOnInit() {
    this.categories$ = this.categoryService.getCategories();
    this.initForm();

    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditMode = true;
      this.loadProduct(this.productId);
    }
  }

  initForm() {
    this.productForm = this.fb.group({
      pokename: ['', Validators.required],
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      type: ['comestible', Validators.required],
      status: ['activo', Validators.required],
      categoryId: ['', Validators.required],
      userId: ['user-default'],
    });
  }

  loadProduct(id: string) {
    this.productService.getProductById(id).subscribe((product) => {
      if (product) {
        this.currentProduct = product;
        this.productForm.patchValue(product);
      }
    });
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.imageFile = input.files[0];
    }
  }

  onRecipeSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.recipeFile = input.files[0];
    }
  }

  async onSubmit() {
    if (this.productForm.invalid) return;

    try {
      if (this.isEditMode && this.productId) {
        await this.productService.updateProduct(
          this.productId,
          this.productForm.value,
          this.imageFile || undefined,
          this.recipeFile || undefined
        );
      } else {
        await this.productService.addProduct(
          this.productForm.value,
          this.imageFile || undefined,
          this.recipeFile || undefined
        );
      }
      this.router.navigate(['/products']);
    } catch (error) {
      console.error('Error al guardar producto:', error);
    }
  }

  cancel() {
    this.router.navigate(['/products']);
  }
}
