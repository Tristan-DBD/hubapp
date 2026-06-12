import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { compressVideo } from '../../../core/compression/video-service'
import { PROGRESS_THROTTLE_MS } from '../../../core/config'
import { dbManager } from '../../../core/db/db-manager'
import { theme } from '../../../core/theme'
import type { VideoItem, DriveDestination } from '../domain/types'
import { generateFinalName } from '../domain/types'
import { destinationService } from '../services/destination.service'
import { uploadService } from '../services/upload.service'
import { styles } from './CoachUploadScreen.styles'
import { DriveFolderBrowser } from './DriveFolderBrowser'
import { VideoCard } from './VideoCard'
import { VideoNamePopup } from './VideoNamePopup'
import { createVideoItem, generateThumbnails } from './coach.utils'

const MODULE_ID = 'coach-upload'

export function CoachUploadScreen() {
  const [destination, setDestination] = useState<DriveDestination | null>(
    () => destinationService.get(),
  )
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [isCompressing, setIsCompressing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null)
  const [showDestinationPicker, setShowDestinationPicker] = useState(false)
  useMemo(() => dbManager.getDB(MODULE_ID), [])

  const mountedRef = useRef(true)
  const videosRef = useRef(videos)
  videosRef.current = videos
  const destinationRef = useRef(destination)
  destinationRef.current = destination
  const lastProgressUpdate = useRef(0)

  useEffect(() => {
    dbManager.registerModule(MODULE_ID)
    return () => {
      mountedRef.current = false
    }
  }, [])

  const editingVideo = editingVideoId
    ? videos.find((v) => v.id === editingVideoId) || null
    : null

  const handleSelectVideos = useCallback(async () => {
    try {
      const { pick, types } = require('@react-native-documents/picker')
      if (typeof pick !== 'function') {
        Alert.alert('Erreur', 'Module picker non disponible.')
        return
      }
      const result = await pick({ type: [types.video], allowMultiSelection: true })
      const files = Array.isArray(result) ? result : [result]
      const newVideos: VideoItem[] = files.map(
        (f: { name?: string | null; size?: number | null; uri?: string }) =>
          createVideoItem(f.uri || '', f.name || 'video.mp4', f.size || 0),
      )
      if (mountedRef.current) {
        setVideos((prev) => [...prev, ...newVideos])
      }
      generateThumbnails(newVideos).then((thumbResults) => {
        if (mountedRef.current && thumbResults.length > 0) {
          setVideos((prev) =>
            prev.map((item) => {
              const t = thumbResults.find((r) => r.id === item.id)
              return t ? { ...item, thumbnailUri: t.uri } : item
            }),
          )
        }
      })
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      if (error?.code === 'CANCELED' || error?.message?.includes('cancel')) {return}
      Alert.alert('Erreur', 'Impossible de sélectionner les vidéos.')
    }
  }, [])

  const handleDeleteVideo = useCallback((id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id))
  }, [])

  const handleRemoveVideo = useCallback((id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id))
  }, [])

  const handleSaveName = useCallback(
    (movement: string, charge: number | null) => {
      if (!editingVideoId) {return}
      const finalName = generateFinalName(movement, charge)
      setVideos((prev) =>
        prev.map((v) =>
          v.id === editingVideoId ? { ...v, movement, charge, finalName } : v,
        ),
      )
      setEditingVideoId(null)
    },
    [editingVideoId],
  )

  const handleToggleCompression = useCallback((id: string) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, skipCompression: !v.skipCompression } : v)),
    )
  }, [])

  const startUpload = useCallback(async () => {
    const currentDestination = destinationRef.current
    if (!currentDestination) {
      Alert.alert('Erreur', 'Veuillez d\'abord définir une destination.')
      return
    }

    const toProcess = videosRef.current.filter(
      (v) => v.movement.trim() && v.uploadStatus !== 'uploaded' && v.uploadStatus !== 'uploading',
    )
    if (toProcess.length === 0) {
      Alert.alert('Info', 'Aucune vidéo à traiter.')
      return
    }

    const toCompress = toProcess.filter(
      (v) => !v.skipCompression && v.compressionStatus === 'pending',
    )
    if (toCompress.length > 0) {
      setIsCompressing(true)
      for (const video of toCompress) {
        if (!mountedRef.current) {break}
        setVideos((prev) =>
          prev.map((v) =>
            v.id === video.id ? { ...v, compressionStatus: 'compressing', compressionProgress: 0 } : v,
          ),
        )
        try {
          const compressedUri = await compressVideo(
            video.localUri,
            (progress) => {
              if (!mountedRef.current) {return}
              setVideos((prev) =>
                prev.map((v) => v.id === video.id ? { ...v, compressionProgress: progress } : v),
              )
            },
          )
          if (!mountedRef.current) {break}
          setVideos((prev) =>
            prev.map((v) =>
              v.id === video.id
                ? { ...v, compressionStatus: 'compressed', compressedUri }
                : v,
            ),
          )
        } catch (err) {
          if (!mountedRef.current) {break}
          setVideos((prev) =>
            prev.map((v) =>
              v.id === video.id
                ? { ...v, compressionStatus: 'error', error: err instanceof Error ? err.message : 'Erreur' }
                : v,
            ),
          )
        }
        await new Promise((r) => setTimeout(r, 500))
      }
      if (mountedRef.current) {setIsCompressing(false)}
    }

    if (!mountedRef.current) {return}

    const toUpload = videosRef.current.filter(
      (v) => v.movement.trim() && v.uploadStatus !== 'uploaded' && v.uploadStatus !== 'uploading',
    )
    if (toUpload.length === 0) {
      Alert.alert('Info', 'Aucune vidéo à uploader.')
      return
    }

    setIsUploading(true)
    const jobs = toUpload.map((video) => ({
      fileUri: video.compressedUri || video.localUri,
      fileName: generateFinalName(video.movement, video.charge),
      mimeType: 'video/mp4',
      onProgress: (progress: number) => {
        if (!mountedRef.current) {return}
        const now = Date.now()
        if (now - lastProgressUpdate.current < PROGRESS_THROTTLE_MS) {return}
        lastProgressUpdate.current = now
        setVideos((prev) =>
          prev.map((v) => v.id === video.id ? { ...v, uploadProgress: progress } : v),
        )
      },
    }))
    setVideos((prev) =>
      prev.map((v) =>
        toUpload.find((t) => t.id === v.id)
          ? { ...v, uploadStatus: 'uploading' as const, uploadProgress: 0 }
          : v,
      ),
    )
    const results = await uploadService.uploadMultiple(jobs, currentDestination.sessionFolderId)
    if (!mountedRef.current) {return}
    setVideos((prev) =>
      prev.map((v) => {
        const result = results.find((r) => r.fileName === v.finalName)
        if (result) {
          return {
            ...v,
            uploadStatus: result.success ? ('uploaded' as const) : ('error' as const),
            error: result.error,
          }
        }
        return v
      }),
    )
    setIsUploading(false)
  }, [])

  const handleDestinationChange = useCallback((dest: DriveDestination) => {
    destinationService.set(dest)
    setDestination(dest)
    setShowDestinationPicker(false)
  }, [])

  const renderItem = useCallback(({ item }: { item: VideoItem }) => (
    <VideoCard
      video={item}
      onPressName={() => setEditingVideoId(item.id)}
      onDelete={() => handleDeleteVideo(item.id)}
      onRemove={() => handleRemoveVideo(item.id)}
      onToggleCompression={() => handleToggleCompression(item.id)}
    />
  ), [handleDeleteVideo, handleRemoveVideo, handleToggleCompression])

  const canUpload = !isUploading && !isCompressing && videos.some(
    (v) => v.movement.trim() && v.uploadStatus !== 'uploaded' && v.uploadStatus !== 'uploading',
  )

  return (
    <View style={styles.container}>
      <View style={styles.destCard}>
        <Text style={styles.destTitle}>Destination actuelle</Text>
        {destination ? (
          <>
            <Text style={styles.destLine}>Bloc {destination.currentBlock}</Text>
            <Text style={styles.destLine}>Semaine {destination.currentWeek}</Text>
            <Text style={styles.destLine}>Séance {destination.currentSession}</Text>
          </>
        ) : (
          <Text style={styles.destNone}>Aucune destination définie</Text>
        )}
        <TouchableOpacity style={styles.destBtn} onPress={() => setShowDestinationPicker(true)}>
          <Text style={styles.destBtnText}>Changer destination</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleSelectVideos}>
          <Text style={styles.actionBtnText}>Choisir vidéos</Text>
        </TouchableOpacity>
        {canUpload && (
          <TouchableOpacity style={[styles.actionBtn, styles.uploadBtn]} onPress={startUpload}>
            <Text style={styles.actionBtnText}>Uploader</Text>
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
        data={videos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        extraData={isUploading || isCompressing}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucune vidéo sélectionnée</Text>}
      />

      {editingVideo && (
        <VideoNamePopup
          visible
          initialMovement={editingVideo.movement}
          initialCharge={editingVideo.charge}
          onSave={handleSaveName}
          onCancel={() => setEditingVideoId(null)}
        />
      )}

      {showDestinationPicker && (
        <DriveFolderBrowser
          onSave={handleDestinationChange}
          onCancel={() => setShowDestinationPicker(false)}
        />
      )}
    </View>
  )
}
