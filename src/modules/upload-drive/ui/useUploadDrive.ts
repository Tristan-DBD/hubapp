import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Alert, BackHandler } from 'react-native'
import { dbManager } from '../../../core/db/db-manager'
import { useUploadQueue } from '../../../core/hooks/useUploadQueue'
import type { UploadStatus } from '../../../core/hooks/useUploadQueue'
import type { DriveFolder } from '../../../core/types'
import type { FileItem } from '../domain/types'
import { getMimeCategory } from '../domain/types'
import { compressionService } from '../services/compression.service'
import { uploadService } from '../services/upload.service'
import { createFileItem, generateFileThumbnails } from './upload.utils'

const MODULE_ID = 'upload-drive'

export function useUploadDrive() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [destinationFolder, setDestinationFolder] =
    useState<DriveFolder | null>(null)
  const [showFolderBrowser, setShowFolderBrowser] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [finishMessage, setFinishMessage] = useState<string | null>(null)
  const [doneCount, setDoneCount] = useState({ uploaded: 0, errors: 0 })

  const pickingRef = useRef(false)
  const prevRunningRef = useRef(false)
  const db = useMemo(() => dbManager.getDB(MODULE_ID), [])

  useEffect(() => {
    dbManager.registerModule(MODULE_ID)
    const saved = db.get('destinationFolder')
    if (saved) {
      setDestinationFolder(saved as DriveFolder)
    }
  }, [db])

  const getFileName = useCallback(
    (id: string) => {
      const f = files.find(x => x.id === id)
      return f ? (f.displayName || f.fileName).trim() : ''
    },
    [files],
  )

  const queue = useUploadQueue({
    folderId: destinationFolder?.id || '',
    getFileName,
    compressFile: useCallback(
      async (id: string, onProgress) => {
        const file = files.find(f => f.id === id)
        if (!file) {
          throw new Error('Fichier introuvable')
        }
        const result = await compressionService.compressFile(
          file.localUri,
          file.mimeType,
          onProgress,
        )
        return { uri: result.compressedUri, skipped: result.skipped }
      },
      [files],
    ),
    uploadFile: useCallback(
      async (id: string, fileName, onProgress, folderId) => {
        const file = files.find(f => f.id === id)
        if (!file) {
          return false
        }
        const result = await uploadService.uploadSingle(
          {
            id,
            fileName,
            fileUri: file.compressedUri || file.localUri,
            mimeType: file.mimeType,
            onProgress,
          },
          folderId,
        )
        return result.success
      },
      [files],
    ),
    onStatusChange: useCallback(
      (id: string, status: UploadStatus, error?: string) => {
        if (status === 'uploaded') {
          setDoneCount(prev => ({ ...prev, uploaded: prev.uploaded + 1 }))
          setFiles(prev => prev.filter(f => f.id !== id))
          return
        }
        if (status === 'error') {
          setDoneCount(prev => ({ ...prev, errors: prev.errors + 1 }))
        }
        setFiles(prev =>
          prev.map(f => {
            if (f.id !== id) {
              return f
            }
            switch (status) {
              case 'compressing':
                return {
                  ...f,
                  compressionStatus: 'compressing' as const,
                  compressionProgress: 0,
                }
              case 'compressed':
                return {
                  ...f,
                  compressionStatus: 'compressed' as const,
                  compressionProgress: 1,
                }
              case 'uploading':
                return {
                  ...f,
                  uploadStatus: 'uploading' as const,
                  uploadProgress: 0,
                }
              case 'error':
                return {
                  ...f,
                  uploadStatus: 'error' as const,
                  error: error || 'Erreur',
                }
              default:
                return f
            }
          }),
        )
      },
      [],
    ),
    onCompressed: useCallback((id: string, uri: string) => {
      setFiles(prev =>
        prev.map(f => (f.id === id ? { ...f, compressedUri: uri } : f)),
      )
    }, []),
    onProgress: useCallback((id: string, stage, progress) => {
      setFiles(prev =>
        prev.map(f =>
          f.id === id
            ? {
                ...f,
                ...(stage === 'compression'
                  ? { compressionProgress: progress }
                  : { uploadProgress: progress }),
              }
            : f,
        ),
      )
    }, []),
  })

  const { uploaded: uploadedCount, errors: errorCount } = doneCount

  useEffect(() => {
    if (prevRunningRef.current && !queue.running) {
      const msg =
        errorCount > 0
          ? `Terminé : ${uploadedCount} OK, ${errorCount} erreur(s)`
          : `Terminé (${uploadedCount} fichier${uploadedCount > 1 ? 's' : ''})`
      setFinishMessage(msg)
      const t = setTimeout(() => {
        setFinishMessage(null)
        setDoneCount({ uploaded: 0, errors: 0 })
      }, 4000)
      return () => clearTimeout(t)
    }
    prevRunningRef.current = queue.running
  }, [queue.running, uploadedCount, errorCount])

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (queue.running) {
        Alert.alert(
          'Upload en cours',
          "Voulez-vous annuler l'upload et quitter ?",
          [
            { text: 'Rester', style: 'cancel' },
            {
              text: 'Annuler et quitter',
              style: 'destructive',
              onPress: () => {
                queue.stop()
                BackHandler.exitApp()
              },
            },
          ],
        )
        return true
      }
      return false
    })
    return () => {
      sub.remove()
      queue.stop()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectFiles = useCallback(async () => {
    if (pickingRef.current) {
      return
    }
    pickingRef.current = true
    try {
      const { pick } = await import('@react-native-documents/picker')
      const result = await pick({ allowMultiSelection: true })
      const picked = Array.isArray(result) ? result : [result]
      const newFiles: FileItem[] = picked.map(
        (f: { name?: string; size?: number; type?: string; uri?: string }) =>
          createFileItem(
            f.uri || '',
            f.name || 'file',
            f.size || 0,
            f.type || 'application/octet-stream',
          ),
      )
      if (newFiles.length > 0) {
        setFiles(prev => [...prev, ...newFiles])
      }
      generateFileThumbnails(newFiles).then(thumbResults => {
        if (thumbResults.length > 0) {
          setFiles(prev =>
            prev.map(item => {
              const t = thumbResults.find(r => r.id === item.id)
              return t ? { ...item, thumbnailUri: t.uri } : item
            }),
          )
        }
      })
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'cancel') {
        return
      }
      const { isErrorWithCode, errorCodes } = await import(
        '@react-native-documents/picker'
      )
      if (
        isErrorWithCode(err) &&
        (err.code === errorCodes.OPERATION_CANCELED ||
          err.code === errorCodes.ASYNC_OP_IN_PROGRESS)
      ) {
        return
      }
      Alert.alert('Erreur', 'Impossible de sélectionner les fichiers.')
    } finally {
      pickingRef.current = false
    }
  }, [])

  const handleDeleteFile = useCallback(
    (id: string) => setFiles(prev => prev.filter(f => f.id !== id)),
    [],
  )

  const handleNameChange = useCallback(
    (id: string, newName: string) =>
      setFiles(prev =>
        prev.map(f => (f.id === id ? { ...f, displayName: newName } : f)),
      ),
    [],
  )

  const handleToggleAutoCompress = useCallback(
    (id: string) =>
      setFiles(prev =>
        prev.map(f =>
          f.id === id ? { ...f, skipAutoCompress: !f.skipAutoCompress } : f,
        ),
      ),
    [],
  )

  const startUpload = useCallback(() => {
    if (!destinationFolder) {
      Alert.alert(
        'Erreur',
        "Veuillez d'abord sélectionner un dossier de destination.",
      )
      return
    }
    const toProcess = files.filter(
      f =>
        f.uploadStatus !== 'uploaded' &&
        f.uploadStatus !== 'uploading' &&
        f.uploadStatus !== 'error' &&
        f.displayName.trim(),
    )
    if (toProcess.length === 0) {
      Alert.alert('Info', 'Aucun fichier à uploader.')
      return
    }
    const skipCompression = toProcess
      .filter(
        f => f.skipAutoCompress || getMimeCategory(f.mimeType) === 'other',
      )
      .map(f => f.id)
    queue.start(
      toProcess.map(f => f.id),
      skipCompression,
    )
  }, [destinationFolder, files, queue])

  const handleDestinationChange = useCallback(
    (folder: DriveFolder) => {
      db.set('destinationFolder', folder)
      setDestinationFolder(folder)
      setShowFolderBrowser(false)
    },
    [db],
  )

  const canUpload =
    !queue.running &&
    files.some(
      f =>
        f.uploadStatus !== 'uploaded' &&
        f.uploadStatus !== 'uploading' &&
        f.uploadStatus !== 'error' &&
        f.displayName.trim(),
    )

  const pendingFiles = useMemo(
    () =>
      files.filter(
        f =>
          f.uploadStatus !== 'uploading' &&
          f.uploadStatus !== 'error' &&
          f.displayName.trim(),
      ).length,
    [files],
  )

  const progressText = useMemo(() => {
    if (!queue.running) {
      return finishMessage
    }
    if (queue.compressingId) {
      const n = queue.compressionRemaining + 1
      return `Compression : ${n} restante${n > 1 ? 's' : ''}`
    }
    if (queue.uploadingId) {
      const n = queue.uploadReady + 1
      return `Upload : ${n} en attente`
    }
    return finishMessage
  }, [
    queue.running,
    queue.compressingId,
    queue.compressionRemaining,
    queue.uploadingId,
    queue.uploadReady,
    finishMessage,
  ])

  return {
    files,
    destinationFolder,
    showFolderBrowser,
    deleteTarget,
    finishMessage,
    doneCount,
    queue,
    canUpload,
    pendingFiles,
    progressText,
    setShowFolderBrowser,
    setDeleteTarget,
    handleSelectFiles,
    startUpload,
    handleDestinationChange,
    handleDeleteFile,
    handleNameChange,
    handleToggleAutoCompress,
  }
}
