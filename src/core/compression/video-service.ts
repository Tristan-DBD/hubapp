import { VIDEO_COMPRESSION_PROGRESS_DIVIDER } from '../config'

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) {return err.message}
  if (typeof err === 'string') {return err}
  if (err && typeof err === 'object') {
    const obj = err as Record<string, unknown>
    if (typeof obj.message === 'string') {return obj.message}
    if (typeof obj.code === 'string') {return `Code: ${obj.code}`}
  }
  return 'Erreur inconnue lors de la compression'
}

export async function compressVideo(
  uri: string,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const { Video } = await import('react-native-compressor')

  const attempts: Array<'auto' | 'manual'> = ['auto', 'manual']
  let lastError: string | null = null

  for (const compressionMethod of attempts) {
    try {
      const result = await Video.compress(uri, {
        compressionMethod,
        quality: 'high',
        progressDivider: VIDEO_COMPRESSION_PROGRESS_DIVIDER,
        getProgress: (p: number) => {
          onProgress?.(p / 100)
        },
      })
      return result as string
    } catch (err) {
      lastError = extractErrorMessage(err)
    }
  }

  throw new Error(lastError ?? 'Échec de la compression vidéo')
}
