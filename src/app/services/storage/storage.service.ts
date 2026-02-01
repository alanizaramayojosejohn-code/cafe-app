import { Injectable, inject } from '@angular/core'
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage'
import { UploadResult } from '../../models/interface.config'
@Injectable()
export class StorageService {
   private storage = inject(Storage)

   async uploadFile(path: string, file: File): Promise<UploadResult> {
      try {
         const fileRef = ref(this.storage, path)
         await uploadBytes(fileRef, file)
         const url = await getDownloadURL(fileRef)

         return { url, path }
      } catch (error) {
         console.error('Error al subir archivo:', error)
         throw new Error('Error al subir el archivo. Por favor, intente nuevamente.')
      }
   }

   async deleteFile(path: string): Promise<void> {
      if (!path) {
         return
      }

      try {
         const fileRef = ref(this.storage, path)
         await deleteObject(fileRef)
      } catch (error) {
         if ((error as any)?.code !== 'storage/object-not-found') {
            console.error('Error al eliminar archivo:', error)
         }
      }
   }

   async deleteFiles(paths: string[]): Promise<void> {
      const deletePromises = paths.filter(Boolean).map((path) => this.deleteFile(path))
      await Promise.allSettled(deletePromises)
   }

   generatePath(folder: string, fileName: string): string {
      const timestamp = Date.now()
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
      return `${folder}/${timestamp}_${sanitizedFileName}`
   }
}
