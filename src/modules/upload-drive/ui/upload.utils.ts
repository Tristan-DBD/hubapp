import type { FileItem } from '../domain/types'
import { getMimeCategory } from '../domain/types'

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {return `${bytes} o`}
  if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(1)} Ko`}
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export function getFileIcon(mimeType: string): string {
  const cat = getMimeCategory(mimeType)
  if (cat === 'video') {return '🎬'}
  if (cat === 'image') {return '🖼️'}
  if (mimeType.includes('pdf')) {return '📄'}
  if (mimeType.includes('audio')) {return '🎵'}
  return '📁'
}

export function createFileItem(uri: string, fileName: string, fileSize: number, mimeType: string): FileItem {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  return {
    id,
    localUri: uri,
    fileName,
    displayName: fileName,
    fileSize,
    mimeType,
    compressionStatus: 'pending',
    compressionProgress: 0,
    compressedUri: null,
    uploadStatus: 'idle',
    uploadProgress: 0,
    thumbnailUri: null,
    skipAutoCompress: false,
    error: null,
  }
}

export async function generateFileThumbnails(
  files: FileItem[],
): Promise<{ id: string; uri: string }[]> {
  const results: { id: string; uri: string }[] = []
  for (const f of files) {
    const cat = getMimeCategory(f.mimeType)
    if (cat === 'image') {
      results.push({ id: f.id, uri: f.localUri })
    } else if (cat === 'video') {
      try {
        const Compressor = require('react-native-compressor')
        const thumb = await Compressor.createVideoThumbnail(f.localUri)
        results.push({ id: f.id, uri: thumb.path })
      } catch {
        // ignore thumbnail failures
      }
    }
  }
  return results
}
