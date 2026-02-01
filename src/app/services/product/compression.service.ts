import { Injectable } from '@angular/core'
import imageCompression from 'browser-image-compression'
import { CompressionOptions } from '../../models/interface.config'

@Injectable()
export class ImageCompressionService {
  private readonly DEFAULT_OPTIONS: CompressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  }

  async compress(file: File, options?: CompressionOptions): Promise<File> {
    try {
      const compressionOptions = {
        ...this.DEFAULT_OPTIONS,
        ...options,
        fileType: file.type,
      }

      const compressedFile = await imageCompression(file, compressionOptions)

      return compressedFile.size < file.size ? compressedFile : file
    } catch (error) {
      console.error('Error al comprimir imagen:', error)
      throw new Error('Error al procesar la imagen. Por favor, intente con otra imagen.')
    }
  }

  async compressBatch(files: File[], options?: CompressionOptions): Promise<File[]> {
    return Promise.all(files.map((file) => this.compress(file, options)))
  }
}
