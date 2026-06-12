export type CompressionStatus = 'pending' | 'compressing' | 'compressed' | 'error' | 'skipped';
export type UploadStatus = 'idle' | 'uploading' | 'uploaded' | 'error';

export interface FileItem {
  compressedUri: string | null;
  compressionProgress: number;
  compressionStatus: CompressionStatus;
  displayName: string;
  error: string | null;
  fileName: string;
  fileSize: number;
  id: string;
  localUri: string;
  mimeType: string;
  skipAutoCompress: boolean;
  thumbnailUri: string | null;
  uploadProgress: number;
  uploadStatus: UploadStatus;
}

export function getMimeCategory(mimeType: string): 'video' | 'image' | 'other' {
  if (mimeType.startsWith('video/')) {return 'video'}
  if (mimeType.startsWith('image/')) {return 'image'}
  return 'other'
}

export function getFileMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
    bmp: 'image/bmp',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    mkv: 'video/x-matroska',
    avi: 'video/x-msvideo',
    webm: 'video/webm',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
    csv: 'text/csv',
    zip: 'application/zip',
    rar: 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    aac: 'audio/aac',
  }
  return mimeMap[ext] || 'application/octet-stream'
}

export function getExtension(fileName: string): string {
  const i = fileName.lastIndexOf('.')
  return i >= 0 ? fileName.slice(i) : ''
}
