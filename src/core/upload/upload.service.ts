import { driveService } from '../google/drive-service'
import { resolveDuplicateNames } from '../utils'

export interface UploadJob {
  fileName: string
  fileUri: string
  id: string
  mimeType: string
  onProgress?: (progress: number) => void
}

export interface UploadResult {
  error: string | null
  fileId: string
  fileName: string
  id: string
  success: boolean
}

export const uploadService = {
  async uploadSingle(
    job: UploadJob,
    parentFolderId: string,
  ): Promise<UploadResult> {
    const finalName = job.fileName
    try {
      const fileId = await driveService.uploadFile(
        job.fileUri,
        finalName,
        parentFolderId,
        job.mimeType,
        job.onProgress,
      )
      return { id: job.id, fileName: finalName, fileId, success: true, error: null }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      return { id: job.id, fileName: finalName, fileId: '', success: false, error: msg }
    }
  },

  async uploadMultiple(
    jobs: UploadJob[],
    parentFolderId: string,
  ): Promise<UploadResult[]> {
    if (jobs.length === 0) {return []}

    const finalNames = resolveDuplicateNames(jobs.map((j) => j.fileName))

    const results: UploadResult[] = await Promise.all(
      jobs.map(async (job, index) => {
        const finalName = finalNames[index]
        try {
          const fileId = await driveService.uploadFile(
            job.fileUri,
            finalName,
            parentFolderId,
            job.mimeType,
            job.onProgress,
          )
          return { id: job.id, fileName: finalName, fileId, success: true, error: null }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error'
          return { id: job.id, fileName: finalName, fileId: '', success: false, error: msg }
        }
      }),
    )

    return results
  },
}
