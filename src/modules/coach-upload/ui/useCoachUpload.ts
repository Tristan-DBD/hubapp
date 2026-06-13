import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Alert, BackHandler } from 'react-native'
import { compressVideo } from '../../../core/compression/video-service'
import { dbManager } from '../../../core/db/db-manager'
import { useUploadQueue } from '../../../core/hooks/useUploadQueue'
import type { VideoItem, DriveDestination } from '../domain/types'
import { generateFinalName } from '../domain/types'
import { destinationService } from '../services/destination.service'
import { uploadService } from '../services/upload.service'
import { createVideoItem, generateThumbnails } from './coach.utils'

const MODULE_ID = 'coach-upload'

export function useCoachUpload() {
  const [destination, setDestination] = useState<DriveDestination | null>(() => destinationService.get())
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null)
  const [showDestinationPicker, setShowDestinationPicker] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [finishMessage, setFinishMessage] = useState<string | null>(null)
  const [doneCount, setDoneCount] = useState({ uploaded: 0, errors: 0 })

  const mountedRef = useRef(true)
  const prevRunningRef = useRef(false)

  useEffect(() => {
    dbManager.registerModule(MODULE_ID)
    return () => { mountedRef.current = false }
  }, [])

  const editingVideo = editingVideoId ? videos.find(v => v.id === editingVideoId) || null : null

  const getFileName = useCallback((id: string) => {
    const v = videos.find(x => x.id === id)
    return v ? generateFinalName(v.movement, v.charge) : ''
  }, [videos])

  const queue = useUploadQueue({
    folderId: destination?.sessionFolderId || '',
    getFileName,
    compressFile: useCallback(async (id: string, onProgress) => {
      const video = videos.find(v => v.id === id)
      if (!video) { throw new Error('Vidéo introuvable') }
      const compressedUri = await compressVideo(video.localUri, onProgress)
      return { uri: compressedUri, skipped: false }
    }, [videos]),
    uploadFile: useCallback(async (id: string, fileName, onProgress, folderId) => {
      const video = videos.find(v => v.id === id)
      if (!video) { return false }
      const result = await uploadService.uploadSingle({ id, fileName, fileUri: video.compressedUri || video.localUri, mimeType: 'video/mp4', onProgress }, folderId)
      return result.success
    }, [videos]),
    onStatusChange: useCallback((id, status, error) => {
      if (status === 'uploaded') { setDoneCount(prev => ({ ...prev, uploaded: prev.uploaded + 1 })); setVideos(prev => prev.filter(v => v.id !== id)); return }
      if (status === 'error') { setDoneCount(prev => ({ ...prev, errors: prev.errors + 1 })) }
      setVideos(prev => prev.map(v => {
        if (v.id !== id) { return v }
        switch (status) {
          case 'compressing': return { ...v, compressionStatus: 'compressing' as const, compressionProgress: 0 }
          case 'compressed': return { ...v, compressionStatus: 'compressed' as const, compressionProgress: 1 }
          case 'uploading': return { ...v, uploadStatus: 'uploading' as const, uploadProgress: 0 }
          case 'error': return { ...v, uploadStatus: 'error' as const, error: error || 'Erreur' }
          default: return v
        }
      }))
    }, []),
    onCompressed: useCallback((id: string, uri: string) => setVideos(prev => prev.map(v => v.id === id ? { ...v, compressedUri: uri } : v)), []),
    onProgress: useCallback((id: string, stage, progress) => setVideos(prev => prev.map(v => v.id === id ? { ...v, ...(stage === 'compression' ? { compressionProgress: progress } : { uploadProgress: progress }) } : v)), []),
  })

  const { uploaded: uploadedVideos, errors: errorVideos } = doneCount

  useEffect(() => {
    if (prevRunningRef.current && !queue.running) {
      const msg = errorVideos > 0 ? `Terminé : ${uploadedVideos} OK, ${errorVideos} erreur(s)` : `Terminé (${uploadedVideos} vidéo${uploadedVideos > 1 ? 's' : ''})`
      setFinishMessage(msg)
      const t = setTimeout(() => { setFinishMessage(null); setDoneCount({ uploaded: 0, errors: 0 }) }, 4000)
      return () => clearTimeout(t)
    }
    prevRunningRef.current = queue.running
  }, [queue.running, uploadedVideos, errorVideos])

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (queue.running) {
        Alert.alert('Upload en cours', 'Voulez-vous annuler l\'upload et quitter ?', [
          { text: 'Rester', style: 'cancel' },
          { text: 'Annuler et quitter', style: 'destructive', onPress: () => { queue.stop(); BackHandler.exitApp() } },
        ])
        return true
      }
      return false
    })
    return () => { sub.remove(); queue.stop() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectVideos = useCallback(async () => {
    try {
      const { pick } = await import('@react-native-documents/picker')
      const result = await pick({ allowMultiSelection: true })
      const files = Array.isArray(result) ? result : [result]
      const newVideos: VideoItem[] = files.map(f => createVideoItem(f.uri || '', f.name || 'video.mp4', f.size || 0))
      if (mountedRef.current) { setVideos(prev => [...prev, ...newVideos]) }
      generateThumbnails(newVideos).then(thumbResults => {
        if (mountedRef.current && thumbResults.length > 0) { setVideos(prev => prev.map(item => { const t = thumbResults.find(r => r.id === item.id); return t ? { ...item, thumbnailUri: t.uri } : item })) }
      })
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      if (error?.code === 'CANCELED' || error?.message?.includes('cancel')) { return }
      Alert.alert('Erreur', 'Impossible de sélectionner les vidéos.')
    }
  }, [])

  const handleDeleteVideo = useCallback((id: string) => setVideos(prev => prev.filter(v => v.id !== id)), [])

  const handleSaveName = useCallback((movement: string, charge: number | null) => {
    if (!editingVideoId) { return }
    const finalName = generateFinalName(movement, charge)
    setVideos(prev => prev.map(v => v.id === editingVideoId ? { ...v, movement, charge, finalName } : v))
    setEditingVideoId(null)
  }, [editingVideoId])

  const handleToggleCompression = useCallback((id: string) => setVideos(prev => prev.map(v => v.id === id ? { ...v, skipCompression: !v.skipCompression } : v)), [])

  const startUpload = useCallback(() => {
    if (!destination) { Alert.alert('Erreur', 'Veuillez d\'abord définir une destination.'); return }
    const toProcess = videos.filter(v => v.movement.trim() && v.uploadStatus !== 'uploaded' && v.uploadStatus !== 'uploading' && v.uploadStatus !== 'error')
    if (toProcess.length === 0) { Alert.alert('Info', 'Aucune vidéo à traiter.'); return }
    const skipCompression = toProcess.filter(v => v.skipCompression).map(v => v.id)
    queue.start(toProcess.map(v => v.id), skipCompression)
  }, [destination, videos, queue])

  const handleDestinationChange = useCallback((dest: DriveDestination) => { destinationService.set(dest); setDestination(dest); setShowDestinationPicker(false) }, [])

  const canUpload = !queue.running && videos.some(v => v.movement.trim() && v.uploadStatus !== 'uploaded' && v.uploadStatus !== 'uploading' && v.uploadStatus !== 'error')

  const pendingVideos = useMemo(() => videos.filter(v => v.movement.trim() && v.uploadStatus !== 'uploading' && v.uploadStatus !== 'error').length, [videos])

  const progressText = useMemo(() => {
    if (!queue.running) { return finishMessage }
    if (queue.compressingId) { const n = queue.compressionRemaining + 1; return `Compression : ${n} restante${n > 1 ? 's' : ''}` }
    if (queue.uploadingId) { const n = queue.uploadReady + 1; return `Upload : ${n} en attente` }
    return finishMessage
  }, [queue.running, queue.compressingId, queue.compressionRemaining, queue.uploadingId, queue.uploadReady, finishMessage])

  return {
    videos, destination, editingVideoId, editingVideo, showDestinationPicker, deleteTarget,
    finishMessage, doneCount, queue, canUpload, pendingVideos, progressText,
    setEditingVideoId, setShowDestinationPicker, setDeleteTarget,
    handleSelectVideos, handleDeleteVideo, handleSaveName, handleToggleCompression,
    startUpload, handleDestinationChange,
  }
}
