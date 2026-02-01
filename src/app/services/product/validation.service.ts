import { Injectable, inject } from '@angular/core'
import { FILE_VALIDATION_CONFIG, FileValidationConfig } from './../../models/interface.config'

@Injectable()
export class FileValidationService {
   private config = inject(FILE_VALIDATION_CONFIG)

   validateImage(file: File): void {
      this.validateFileType(file, this.config.allowedImageTypes, 'imagen', 'JPEG, PNG, WebP')
      this.validateFileSize(file, 'imagen')
   }

   validateRecipe(file: File): void {
      this.validateFileType(file, this.config.allowedRecipeTypes, 'receta', 'PDF, JPEG, PNG, WebP')
      this.validateFileSize(file, 'receta')
   }

   private validateFileType(file: File, allowedTypes: string[], fileTypeName: string, allowedTypesLabel: string): void {
      if (!allowedTypes.includes(file.type)) {
         throw new Error(
            `Formato de ${fileTypeName} no válido. Solo se permiten: ${allowedTypesLabel}. Recibido: ${file.type}`
         )
      }
   }

   private validateFileSize(file: File, fileTypeName: string): void {
      if (file.size > this.config.maxFileSize) {
         const maxSizeMB = (this.config.maxFileSize / 1024 / 1024).toFixed(0)
         const currentSizeMB = (file.size / 1024 / 1024).toFixed(2)
         throw new Error(
            `El archivo de ${fileTypeName} es demasiado grande. Tamaño máximo: ${maxSizeMB}MB. Tamaño actual: ${currentSizeMB}MB`
         )
      }
   }

   getMaxFileSizeMB(): number {
      return this.config.maxFileSize / 1024 / 1024
   }

   getAllowedImageTypes(): string[] {
      return [...this.config.allowedImageTypes]
   }

   getAllowedRecipeTypes(): string[] {
      return [...this.config.allowedRecipeTypes]
   }
}
