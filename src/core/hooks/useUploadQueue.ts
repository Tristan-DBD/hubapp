import { useState, useCallback, useEffect, useRef } from 'react'

export type UploadStatus = 'pending' | 'compressing' | 'compressed' | 'uploading' | 'uploaded' | 'error'

interface UploadQueueOptions {
  compressFile: (id: string, onProgress: (p: number) => void) => Promise<{ skipped: boolean; uri: string | null }>
  folderId: string
  getFileName: (id: string) => string
  onCompressed?: (id: string, uri: string) => void
  onProgress: (id: string, stage: 'compression' | 'upload', progress: number) => void
  onStatusChange: (id: string, status: UploadStatus, error?: string) => void
  uploadFile: (id: string, fileName: string, onProgress: (p: number) => void, folderId: string) => Promise<boolean>
}

export function useUploadQueue(options: UploadQueueOptions) {
  const [toCompress, setToCompress] = useState<string[]>([])
  const [readyToUpload, setReadyToUpload] = useState<string[]>([])
  const [compressingId, setCompressingId] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const cancelledRef = useRef(false)

  const start = useCallback((ids: string[], skipCompressionIds: string[]) => {
    setToCompress(ids.filter((id) => !skipCompressionIds.includes(id)))
    setReadyToUpload(ids.filter((id) => skipCompressionIds.includes(id)))
    setCompressingId(null)
    setUploadingId(null)
    cancelledRef.current = false
    setRunning(true)
  }, [])

  const stop = useCallback(() => {
    cancelledRef.current = true
    setRunning(false)
    setToCompress([])
    setReadyToUpload([])
    setCompressingId(null)
    setUploadingId(null)
  }, [])

  useEffect(() => {
    if (!running || compressingId !== null || toCompress.length === 0) {return}
    const id = toCompress[0]
    setCompressingId(id)
    options.onStatusChange(id, 'compressing')
    ;(async () => {
      try {
        const result = await options.compressFile(id, (p) => {
          if (!cancelledRef.current) {options.onProgress(id, 'compression', p)}
        })
        if (cancelledRef.current) {return}
        options.onStatusChange(id, 'compressed')
        if (result.uri) {options.onCompressed?.(id, result.uri)}
        setToCompress((prev) => prev.filter((x) => x !== id))
        setReadyToUpload((prev) => [...prev, id])
      } catch (err) {
        if (cancelledRef.current) {return}
        const msg = err instanceof Error ? err.message : 'Erreur compression'
        options.onStatusChange(id, 'error', msg)
        setToCompress((prev) => prev.filter((x) => x !== id))
      } finally {
        if (!cancelledRef.current) {setCompressingId(null)}
      }
    })()
  }, [running, compressingId, toCompress, options])

  useEffect(() => {
    if (!running || uploadingId !== null || readyToUpload.length === 0) {return}
    const id = readyToUpload[0]
    setUploadingId(id)
    options.onStatusChange(id, 'uploading')
    ;(async () => {
      try {
        const fileName = options.getFileName(id)
        const success = await options.uploadFile(id, fileName, (p) => {
          if (!cancelledRef.current) {options.onProgress(id, 'upload', p)}
        }, options.folderId)
        if (cancelledRef.current) {return}
        options.onStatusChange(id, success ? 'uploaded' : 'error', success ? undefined : 'Upload failed')
        setReadyToUpload((prev) => prev.filter((x) => x !== id))
      } catch (err) {
        if (cancelledRef.current) {return}
        const msg = err instanceof Error ? err.message : 'Erreur upload'
        options.onStatusChange(id, 'error', msg)
        setReadyToUpload((prev) => prev.filter((x) => x !== id))
      } finally {
        if (!cancelledRef.current) {setUploadingId(null)}
      }
    })()
  }, [running, uploadingId, readyToUpload, options])

  useEffect(() => {
    if (
      running &&
      toCompress.length === 0 &&
      readyToUpload.length === 0 &&
      compressingId === null &&
      uploadingId === null
    ) {
      setRunning(false)
    }
  }, [running, toCompress, readyToUpload, compressingId, uploadingId])

  const total = toCompress.length + readyToUpload.length + (compressingId ? 1 : 0) + (uploadingId ? 1 : 0)

  return {
    start,
    stop,
    running,
    compressingId,
    uploadingId,
    compressionRemaining: toCompress.length,
    uploadReady: readyToUpload.length,
    total,
  }
}
