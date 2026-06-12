export type CompressionStatus = 'pending' | 'compressing' | 'compressed' | 'error';

export type UploadStatus = 'idle' | 'uploading' | 'uploaded' | 'error';

export interface VideoItem {
  charge: number | null;
  compressedUri: string | null;
  compressionProgress: number;
  compressionStatus: CompressionStatus;
  error: string | null;
  fileName: string;
  fileSize: number;
  finalName: string;
  id: string;
  localUri: string;
  movement: string;
  skipCompression: boolean;
  thumbnailUri: string | null;
  uploadProgress: number;
  uploadStatus: UploadStatus;
}

export interface DriveDestination {
  blockFolderId: string;
  currentBlock: number;
  currentSession: number;
  currentWeek: number;
  sessionFolderId: string;
  weekFolderId: string;
}

export function generateFinalName(movement: string, charge: number | null): string {
  const base = movement.trim()
  if (!base) {return ''}
  if (charge !== null && !isNaN(charge)) {
    const formatted = Number.isInteger(charge) ? charge.toString() : charge.toString().replace('.', ',')
    return `${base} - ${formatted} kgs`
  }
  return base
}

export function validateChargeInput(value: string): number | null {
  if (!value.trim()) {return null}
  const normalized = value.trim().replace(',', '.')
  const parsed = parseFloat(normalized)
  if (isNaN(parsed) || parsed < 0) {return null}
  return parsed
}
