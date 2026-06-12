import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { PROGRESS_THROTTLE_MS } from '../../../core/config'
import { dbManager } from '../../../core/db/db-manager'
import { theme } from '../../../core/theme'
import type { DriveFolder } from '../../../core/types'
import type { FileItem } from '../domain/types'
import { compressionService } from '../services/compression.service'
import { uploadService } from '../services/upload.service'
import { FileCard } from './FileCard'
import { FolderBrowserModal } from './FolderBrowserModal'
import { createFileItem, generateFileThumbnails } from './upload.utils'

const MODULE_ID = 'upload-drive'

export function UploadDriveScreen() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [destinationFolder, setDestinationFolder] = useState<DriveFolder | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showFolderBrowser, setShowFolderBrowser] = useState(false)

  const mountedRef = useRef(true)
  const filesRef = useRef(files)
  filesRef.current = files
  const destRef = useRef(destinationFolder)
  destRef.current = destinationFolder
  const pickingRef = useRef(false)
  const db = useMemo(() => dbManager.getDB(MODULE_ID), [])
  const lastProgressUpdate = useRef(0)

  useEffect(() => {
    dbManager.registerModule(MODULE_ID)
    const saved = db.get('destinationFolder')
    if (saved) {setDestinationFolder(saved as DriveFolder)}
    return () => {
      mountedRef.current = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectFiles = useCallback(async () => {
    if (pickingRef.current) {return}
    pickingRef.current = true
    try {
      const { pick } = await import('@react-native-documents/picker')
      const result = await pick({ allowMultiSelection: true })
      const picked = Array.isArray(result) ? result : [result]
      const newFiles: FileItem[] = picked.map((f: any) => {
        const name = f.name || 'file'
        return createFileItem(f.uri || '', name, f.size || 0, f.type || 'application/octet-stream')
      })
      if (mountedRef.current) {setFiles((prev) => [...prev, ...newFiles])}
      generateFileThumbnails(newFiles).then((thumbResults) => {
        if (mountedRef.current && thumbResults.length > 0) {
          setFiles((prev) =>
            prev.map((item) => {
              const t = thumbResults.find((r) => r.id === item.id)
              return t ? { ...item, thumbnailUri: t.uri } : item
            }),
          )
        }
      })
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'cancel') {return}
      const { isErrorWithCode, errorCodes } = await import('@react-native-documents/picker')
      if (
        isErrorWithCode(err) && (
          err.code === errorCodes.OPERATION_CANCELED ||
          err.code === errorCodes.ASYNC_OP_IN_PROGRESS
        )
      ) {return}
      Alert.alert('Erreur', 'Impossible de sélectionner les fichiers.')
    } finally {
      pickingRef.current = false
    }
  }, [])

  const handleDeleteFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const handleNameChange = useCallback((id: string, newName: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, displayName: newName } : f)),
    )
  }, [])

  const handleToggleAutoCompress = useCallback((id: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, skipAutoCompress: !f.skipAutoCompress } : f)),
    )
  }, [])

  const startUpload = useCallback(async () => {
    const currentDest = destRef.current
    if (!currentDest) {
      Alert.alert('Erreur', 'Veuillez d\'abord sélectionner un dossier de destination.')
      return
    }

    const toProcess = filesRef.current.filter(
      (f) => f.uploadStatus !== 'uploaded' && f.uploadStatus !== 'uploading' && f.displayName.trim(),
    )
    if (toProcess.length === 0) {
      Alert.alert('Info', 'Aucun fichier à uploader.')
      return
    }

    // Phase 1: Auto-compress compatible files that haven't opted out
    const toCompress = toProcess.filter(
      (f) => !f.skipAutoCompress && f.compressionStatus === 'pending',
    )
    if (toCompress.length > 0) {
      setIsCompressing(true)
      await Promise.all(
        toCompress.map(async (file) => {
          if (!mountedRef.current) {return}
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id
                ? { ...f, compressionStatus: 'compressing' as const, compressionProgress: 0 }
                : f,
            ),
          )
          try {
            const { compressedUri, skipped } = await compressionService.compressFile(
              file.localUri, file.mimeType,
              (progress) => {
                if (!mountedRef.current) {return}
                setFiles((prev) =>
                  prev.map((f) => f.id === file.id ? { ...f, compressionProgress: progress } : f),
                )
              },
            )
            if (!mountedRef.current) {return}
            setFiles((prev) =>
              prev.map((f) =>
                f.id === file.id
                  ? {
                      ...f,
                      compressionStatus: skipped ? ('skipped' as const) : ('compressed' as const),
                      compressionProgress: skipped ? 0 : 1,
                      compressedUri: skipped ? null : compressedUri,
                    }
                  : f,
              ),
            )
          } catch (err) {
            if (!mountedRef.current) {return}
            setFiles((prev) =>
              prev.map((f) =>
                f.id === file.id
                  ? { ...f, compressionStatus: 'error' as const, error: err instanceof Error ? err.message : 'Erreur compression' }
                  : f,
              ),
            )
          }
        }),
      )
      if (mountedRef.current) {setIsCompressing(false)}
    }

    if (!mountedRef.current) {return}

    // Phase 2: Upload everything
    const toUpload = filesRef.current.filter(
      (f) => f.uploadStatus !== 'uploaded' && f.uploadStatus !== 'uploading' && f.displayName.trim(),
    )
    if (toUpload.length === 0) {
      Alert.alert('Info', 'Aucun fichier à uploader.')
      return
    }

    setIsUploading(true)
    const jobs = toUpload.map((file) => ({
      fileUri: file.compressedUri || file.localUri,
      fileName: file.displayName.trim(),
      mimeType: file.mimeType,
      onProgress: (progress: number) => {
        if (!mountedRef.current) {return}
        const now = Date.now()
        if (now - lastProgressUpdate.current < PROGRESS_THROTTLE_MS) {return}
        lastProgressUpdate.current = now
        setFiles((prev) =>
          prev.map((f) => f.id === file.id ? { ...f, uploadProgress: progress } : f),
        )
      },
    }))
    setFiles((prev) =>
      prev.map((f) =>
        toUpload.find((t) => t.fileName === f.displayName.trim() && f.uploadStatus !== 'uploaded')
          ? { ...f, uploadStatus: 'uploading' as const, uploadProgress: 0 }
          : f,
      ),
    )
    const results = await uploadService.uploadMultiple(jobs, currentDest.id)
    if (!mountedRef.current) {return}
    setFiles((prev) =>
      prev.map((f) => {
        const result = results.find((r) => r.fileName === f.displayName.trim())
        if (result) {
          return { ...f, uploadStatus: result.success ? ('uploaded' as const) : ('error' as const), error: result.error }
        }
        if (f.uploadStatus === 'uploading') {return { ...f, uploadStatus: 'idle' as const }}
        return f
      }),
    )
    setIsUploading(false)
  }, [])

  const handleDestinationChange = useCallback(
    (folder: DriveFolder) => {
      db.set('destinationFolder', folder)
      setDestinationFolder(folder)
      setShowFolderBrowser(false)
    },
    [db],
  )

  const canUpload = !isUploading && !isCompressing && files.some(
    (f) => f.uploadStatus !== 'uploaded' && f.uploadStatus !== 'uploading' && f.displayName.trim(),
  )

  const renderItem = useCallback(
    ({ item }: { item: FileItem }) => (
      <FileCard
        file={item}
        onNameChange={(name) => handleNameChange(item.id, name)}
        onDelete={() => handleDeleteFile(item.id)}
        onRemove={() => handleRemoveFile(item.id)}
        onToggleAutoCompress={() => handleToggleAutoCompress(item.id)}
      />
    ),
    [handleNameChange, handleDeleteFile, handleRemoveFile, handleToggleAutoCompress],
  )

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Téléversement Drive</Text>

      <View style={styles.destCard}>
        <Text style={styles.destLabel}>Destination</Text>
        <Text style={styles.destValue}>
          {destinationFolder ? destinationFolder.name : 'Aucun dossier sélectionné'}
        </Text>
        <TouchableOpacity style={styles.destBtn} onPress={() => setShowFolderBrowser(true)}>
          <Text style={styles.destBtnText}>
            {destinationFolder ? 'Changer de dossier' : 'Choisir un dossier'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleSelectFiles}>
          <Text style={styles.actionBtnText}>Choisir fichiers</Text>
        </TouchableOpacity>
        {canUpload && (
          <TouchableOpacity style={[styles.actionBtn, styles.uploadBtn]} onPress={startUpload}>
            <Text style={styles.actionBtnText}>Tout uploader</Text>
          </TouchableOpacity>
        )}
      </View>

      {(isCompressing || isUploading) && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.primary} size="small" />
          <Text style={styles.loadingText}>
            {isCompressing ? 'Compression en cours...' : 'Upload en cours...'}
          </Text>
        </View>
      )}

      <FlatList
        data={files}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        extraData={isUploading || isCompressing}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucun fichier sélectionné</Text>}
      />

      {showFolderBrowser && (
        <FolderBrowserModal
          onSelect={handleDestinationChange}
          onCancel={() => setShowFolderBrowser(false)}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: theme.text, marginBottom: 16, textAlign: 'center' },
  destCard: { backgroundColor: theme.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
  destLabel: { fontSize: 14, fontWeight: '600', color: theme.textSecondary, marginBottom: 4 },
  destValue: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 10 },
  destBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: theme.primary, alignItems: 'center' },
  destBtnText: { color: theme.primary, fontWeight: '600', fontSize: 13 },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  actionBtn: { backgroundColor: theme.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  uploadBtn: { backgroundColor: theme.success },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: theme.surfaceAlt, borderRadius: 8 },
  loadingText: { color: theme.textSecondary, fontSize: 13 },
  list: { paddingBottom: 40 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 15, color: theme.textMuted },
})
