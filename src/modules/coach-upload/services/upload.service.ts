import { driveService } from '../../../core/google/drive-service'
import { resolveDuplicateNames } from '../../../core/utils'

interface UploadJob {
  fileName: string;
  fileUri: string;
  mimeType: string;
  onProgress?: (progress: number) => void;
}

interface UploadResult {
  error: string | null;
  fileId: string;
  fileName: string;
  success: boolean;
}

export const uploadService = {
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
          return { fileName: finalName, fileId, success: true, error: null }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error'
          return { fileName: finalName, fileId: '', success: false, error: msg }
        }
      }),
    )

    return results
  },
}
