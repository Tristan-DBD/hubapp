import type { VideoItem } from '../domain/types'

export function createVideoItem(uri: string, fileName: string, fileSize: number): VideoItem {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  return {
    id,
    localUri: uri,
    fileName,
    fileSize,
    compressionStatus: 'pending',
    compressionProgress: 0,
    compressedUri: null,
    uploadStatus: 'idle',
    uploadProgress: 0,
    movement: '',
    charge: null,
    finalName: '',
    thumbnailUri: null,
    error: null,
    skipCompression: false,
  }
}

export async function generateThumbnails(
  videos: VideoItem[],
): Promise<{ id: string; uri: string }[]> {
  const results: { id: string; uri: string }[] = []
  for (const v of videos) {
    try {
      const Compressor = require('react-native-compressor')
      const thumb = await Compressor.createVideoThumbnail(v.localUri)
      results.push({ id: v.id, uri: thumb.path })
    } catch {
      // ignore thumbnail failures
    }
  }
  return results
}
