import { InjectionToken } from '@angular/core'

export interface FileValidationConfig {
   allowedImageTypes: string[]
   allowedRecipeTypes: string[]
   maxFileSize: number
}

export const FILE_VALIDATION_CONFIG = new InjectionToken<FileValidationConfig>('FileValidationConfig')

export const DEFAULT_FILE_VALIDATION_CONFIG: FileValidationConfig = {
   allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
   allowedRecipeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
   maxFileSize: 5 * 1024 * 1024,
}

