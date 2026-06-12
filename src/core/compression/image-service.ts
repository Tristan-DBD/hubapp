import { IMAGE_COMPRESSION_QUALITY } from '../config'

export async function compressImage(uri: string): Promise<string> {
  const { Image } = await import('react-native-compressor')
  const result = await Image.compress(uri, {
    compressionMethod: 'auto',
    quality: IMAGE_COMPRESSION_QUALITY,
  })
  return result as string
}
