import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CategoryService } from '../../services/category/category';
import { Category, CategoryFormData } from '../../models/category';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class CategoriesComponent implements OnInit, OnDestroy {
  private categoryService = inject(CategoryService);
  private subscription?: Subscription;

  categories: Category[] = [];
  newCategoryName = '';
  editingCategory: Category | null = null;
  editingName = '';
  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private loadCategories(): void {
    this.subscription = this.categoryService.listenCategories().subscribe({
      next: (categories) => (this.categories = categories),
      error: (error) => this.handleError('Error al cargar categorías', error),
    });
  }

  async addCategory(): Promise<void> {
    if (!this.validateInput(this.newCategoryName)) return;

    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.categoryService.createCategory({ name: this.newCategoryName.trim() });
      this.newCategoryName = '';
    } catch (error) {
      this.handleError('Error al crear categoría', error);
    } finally {
      this.isLoading = false;
    }
  }

  startEdit(category: Category): void {
    this.editingCategory = category;
    this.editingName = category.name;
  }

  cancelEdit(): void {
    this.editingCategory = null;
    this.editingName = '';
  }

  async updateCategory(): Promise<void> {
    if (!this.editingCategory?.id || !this.validateInput(this.editingName)) return;

    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.categoryService.updateCategory(this.editingCategory.id, {
        name: this.editingName.trim(),
      });
      this.cancelEdit();
    } catch (error) {
      this.handleError('Error al actualizar categoría', error);
    } finally {
      this.isLoading = false;
    }
  }

  async deleteCategory(id: string | undefined): Promise<void> {
    if (!id || !confirm('¿Estás seguro de eliminar esta categoría?')) return;

    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.categoryService.deleteCategory(id);
    } catch (error) {
      this.handleError('Error al eliminar categoría', error);
    } finally {
      this.isLoading = false;
    }
  }

  private validateInput(name: string): boolean {
    if (!this.categoryService.validateCategoryName(name)) {
      this.errorMessage = 'El nombre debe tener al menos 3 caracteres';
      return false;
    }
    return true;
  }

  private handleError(message: string, error: any): void {
    console.error(message, error);
    this.errorMessage = message;
  }
}
