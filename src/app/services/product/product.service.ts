import { Injectable, inject } from '@angular/core'
import { Observable, from } from 'rxjs'
import { uuidv7 } from 'uuidv7'
import { Product, ProductCreate, FileUploadData } from '../../models/product.model'
import { ProductRepositoryService } from './product-repository.service'
import { StorageService } from '../storage/storage.service'
import { FileValidationService } from './validation.service'
import { ImageCompressionService } from './compression.service'

@Injectable({
   providedIn: 'root',
})
export class ProductService {
   private repository = inject(ProductRepositoryService)
   private storageService = inject(StorageService)
   private fileValidator = inject(FileValidationService)
   private imageCompressor = inject(ImageCompressionService)

   getProducts(): Observable<Product[]> {
      return this.repository.getAll()
   }

   getProductById(id: string): Observable<Product | undefined> {
      return this.repository.getById(id)
   }

   getProductsByCategory(categoryId: string): Observable<Product[]> {
      return this.repository.getByCategory(categoryId)
   }

   checkPokenameExist$(pokename: string, excludeId?: string): Observable<boolean> {
      return from(this.repository.existsByPokename(pokename, excludeId))
   }

   async addProduct(product: ProductCreate, imageFile?: File, recipeFile?: File): Promise<string> {
      try {
         const productId = this.generateId()
         const normalizedPokename = product.pokename.trim().toLowerCase()

         const exists = await this.repository.existsByPokename(normalizedPokename)
         if (exists) {
            throw new Error(`El pokename "${product.pokename}" ya está en uso`)
         }

         const [imageData, recipeData] = await Promise.all([
            this.processImageUpload(imageFile),
            this.processRecipeUpload(recipeFile),
         ])

         await this.repository.create(productId, {
            ...product,
            pokename: normalizedPokename,
            ...imageData,
            ...recipeData,
         })

         return productId
      } catch (error) {
         console.error('Error al crear producto:', error)
         throw error
      }
   }

   async updateProduct(id: string, product: Partial<Product>, imageFile?: File, recipeFile?: File): Promise<void> {
      try {
         let updates: Partial<Product> = { ...product }

         if (product.pokename) {
            const normalizedPokename = product.pokename.trim().toLowerCase()
            const exists = await this.repository.existsByPokename(normalizedPokename, id)
            if (exists) {
               throw new Error(`El pokename "${product.pokename}" ya está en uso`)
            }
            updates.pokename = normalizedPokename
         }

         if (imageFile) {
            const imageData = await this.processImageUpload(imageFile)
            updates = { ...updates, ...imageData }

            if (product.imagePath) {
               await this.storageService.deleteFile(product.imagePath)
            }
         }

         if (recipeFile) {
            const recipeData = await this.processRecipeUpload(recipeFile)
            updates = { ...updates, ...recipeData }

            if (product.recipePath) {
               await this.storageService.deleteFile(product.recipePath)
            }
         }

         await this.repository.update(id, updates)
      } catch (error) {
         console.error('Error al actualizar producto:', error)
         throw error
      }
   }

   async deleteProduct(id: string, imagePath?: string, recipePath?: string): Promise<void> {
      try {
         await this.storageService.deleteFiles([imagePath, recipePath].filter(Boolean) as string[])

         await this.repository.delete(id)
      } catch (error) {
         console.error('Error al eliminar producto:', error)
         throw new Error('Erro al eliminar el producto. Por favor, intente nuevamente.')
      }
   }

   private generateId(): string {
      return uuidv7()
   }

   private async processImageUpload(file?: File): Promise<FileUploadData> {
      if (!file) {
         return {}
      }

      try {
         this.fileValidator.validateImage(file)

         const compressedImage = await this.imageCompressor.compress(file)

         const path = this.storageService.generatePath('products', file.name)
         const { url } = await this.storageService.uploadFile(path, compressedImage)

         return {
            imageUrl: url,
            imagePath: path,
         }
      } catch (error) {
         console.error('Error al procesar imagen:', error)
         throw error
      }
   }

   private async processRecipeUpload(file?: File): Promise<FileUploadData> {
      if (!file) {
         return {}
      }

      try {
         this.fileValidator.validateRecipe(file)

         const path = this.storageService.generatePath('recipes', file.name)
         const { url } = await this.storageService.uploadFile(path, file)

         return {
            recipeUrl: url,
            recipePath: path,
         }
      } catch (error) {
         console.error('Error al procesar receta:', error)
         throw error
      }
   }
}
