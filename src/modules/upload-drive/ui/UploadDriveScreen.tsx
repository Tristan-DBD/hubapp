import React from 'react'
import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import { ConfirmModal, QueueStatusBar } from '../../../core/ui'
import { FileCard } from './FileCard'
import { FolderBrowserModal } from './FolderBrowserModal'
import { styles } from './UploadDriveScreen.styles'
import { useUploadDrive } from './useUploadDrive'

export function UploadDriveScreen() {
  const {
    files,
    destinationFolder,
    showFolderBrowser,
    deleteTarget,
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
  } = useUploadDrive()

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Téléversement Drive</Text>

      <View style={styles.destCard}>
        <Text style={styles.destLabel}>Destination</Text>
        <Text style={styles.destValue}>
          {destinationFolder
            ? destinationFolder.name
            : 'Aucun dossier sélectionné'}
        </Text>
        <TouchableOpacity
          style={styles.destBtn}
          onPress={() => setShowFolderBrowser(true)}
        >
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
          <TouchableOpacity
            style={[styles.actionBtn, styles.uploadBtn]}
            onPress={startUpload}
          >
            <Text style={styles.actionBtnText}>Tout uploader</Text>
          </TouchableOpacity>
        )}
      </View>

      <QueueStatusBar
        total={files.length}
        pending={pendingFiles}
        uploaded={doneCount.uploaded}
        errors={doneCount.errors}
        running={queue.running}
        progressText={progressText}
      />

      <FlatList
        data={files}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <FileCard
            file={item}
            onNameChange={name => handleNameChange(item.id, name)}
            onDelete={() =>
              setDeleteTarget({
                id: item.id,
                name: item.displayName || item.fileName,
              })
            }
            onRemove={() => handleDeleteFile(item.id)}
            onToggleAutoCompress={() => handleToggleAutoCompress(item.id)}
          />
        )}
        extraData={queue.running}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aucun fichier sélectionné</Text>
        }
      />

      {showFolderBrowser && (
        <FolderBrowserModal
          onSelect={handleDestinationChange}
          onCancel={() => setShowFolderBrowser(false)}
        />
      )}

      <ConfirmModal
        visible={!!deleteTarget}
        title="Supprimer"
        message={`Supprimer "${deleteTarget?.name || ''}" ?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            handleDeleteFile(deleteTarget.id)
          }
          setDeleteTarget(null)
        }}
      />
    </View>
  )
}
