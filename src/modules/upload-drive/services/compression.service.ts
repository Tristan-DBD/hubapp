import { compressImage } from '../../../core/compression/image-service'
import { compressVideo } from '../../../core/compression/video-service'
import { getMimeCategory } from '../domain/types'

export const compressionService = {
  async compressFile(
    uri: string,
    mimeType: string,
    onProgress?: (progress: number) => void,
  ): Promise<{ compressedUri: string; skipped: boolean }> {
    const category = getMimeCategory(mimeType)

    if (category === 'video') {
      const result = await compressVideo(uri, onProgress)
      return { compressedUri: result, skipped: false }
    }

    if (category === 'image') {
      const result = await compressImage(uri)
      return { compressedUri: result, skipped: false }
    }

    return { compressedUri: uri, skipped: true }
  },
}
