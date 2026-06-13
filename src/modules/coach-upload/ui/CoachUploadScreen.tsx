import React from 'react'
import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import { ConfirmModal, QueueStatusBar } from '../../../core/ui'
import { styles } from './CoachUploadScreen.styles'
import { DriveFolderBrowser } from './DriveFolderBrowser'
import { VideoCard } from './VideoCard'
import { VideoNamePopup } from './VideoNamePopup'
import { useCoachUpload } from './useCoachUpload'

export function CoachUploadScreen() {
  const {
    videos, destination, editingVideo, showDestinationPicker, deleteTarget,
    doneCount, queue, canUpload, pendingVideos, progressText,
    setEditingVideoId, setShowDestinationPicker, setDeleteTarget,
    handleSelectVideos, handleDeleteVideo, handleSaveName, handleToggleCompression,
    startUpload, handleDestinationChange,
  } = useCoachUpload()

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

      <QueueStatusBar
        total={videos.length}
        pending={pendingVideos}
        uploaded={doneCount.uploaded}
        errors={doneCount.errors}
        running={queue.running}
        progressText={progressText}
      />

      <FlatList
        data={videos}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <VideoCard
            video={item}
            onPressName={() => setEditingVideoId(item.id)}
            onDelete={() => setDeleteTarget({ id: item.id, name: item.finalName || item.fileName })}
            onRemove={() => handleDeleteVideo(item.id)}
            onToggleCompression={() => handleToggleCompression(item.id)}
          />
        )}
        extraData={queue.running}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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

      <ConfirmModal
        visible={!!deleteTarget}
        title="Supprimer"
        message={`Supprimer "${deleteTarget?.name || ''}" ?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) { handleDeleteVideo(deleteTarget.id) }
          setDeleteTarget(null)
        }}
      />
    </View>
  )
}
