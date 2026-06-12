import React from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from 'react-native'
import { useSlideOut } from '../../../core/hooks/useSlideOut'
import { theme } from '../../../core/theme'
import { ProgressBar } from '../../../core/ui/ProgressBar'
import { getMimeCategory } from '../domain/types'
import type { FileItem } from '../domain/types'
import { getFileIcon, formatFileSize } from './upload.utils'

interface FileCardProps {
  file: FileItem;
  onDelete: () => void;
  onNameChange: (name: string) => void;
  onRemove?: () => void;
  onToggleAutoCompress?: () => void;
}

export function FileCard({ file, onNameChange, onDelete, onRemove, onToggleAutoCompress }: FileCardProps) {
  const cat = getMimeCategory(file.mimeType)
  const showThumbnail = file.thumbnailUri && (cat === 'image' || cat === 'video')
  const canAutoCompress = cat !== 'other' && file.compressionStatus === 'pending'

  const translateX = useSlideOut(file.uploadStatus === 'uploaded', onRemove)

  return (
    <Animated.View style={[styles.card, { transform: [{ translateX }] }]}>
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>

      {showThumbnail && (
        <Image
          source={{ uri: file.thumbnailUri! }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      )}

      <View style={styles.headerRow}>
        <Text style={styles.fileIcon}>{getFileIcon(file.mimeType)}</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.fileSize}>{formatFileSize(file.fileSize)}</Text>
          <Text style={styles.mimeBadge}>{file.mimeType}</Text>
        </View>
      </View>

      <Text style={styles.nameLabel}>Nom du fichier</Text>
      <TextInput
        style={styles.nameInput}
        value={file.displayName}
        onChangeText={onNameChange}
        placeholder="Nom du fichier"
        placeholderTextColor={theme.textMuted}
        autoCapitalize="none"
      />

      {canAutoCompress && (
        <TouchableOpacity style={styles.autoCompressRow} onPress={onToggleAutoCompress}>
          <View style={[styles.checkbox, !file.skipAutoCompress && styles.checkboxActive]}>
            {!file.skipAutoCompress && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.autoCompressLabel}>Compresser</Text>
        </TouchableOpacity>
      )}

      {file.compressionStatus === 'compressing' && (
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>Compression...</Text>
          <ProgressBar progress={file.compressionProgress} color={theme.primary} />
        </View>
      )}
      {file.compressionStatus === 'compressed' && (
        <Text style={styles.successText}>Compression terminée ✓</Text>
      )}
      {file.compressionStatus === 'skipped' && (
        <Text style={styles.skipText}>⏭️ Non compressé (type non supporté)</Text>
      )}
      {file.compressionStatus === 'error' && (
        <Text style={styles.errorText}>Erreur : {file.error}</Text>
      )}

      {file.uploadStatus === 'uploading' && (
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>Upload...</Text>
          <ProgressBar progress={file.uploadProgress} color={theme.success} />
        </View>
      )}
      {file.uploadStatus === 'uploaded' && (
        <Text style={styles.successText}>Upload terminé ✓</Text>
      )}
      {file.uploadStatus === 'error' && (
        <Text style={styles.errorText}>Erreur upload : {file.error}</Text>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
    position: 'relative',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: theme.surfaceAlt,
  },
  deleteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.danger,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingRight: 36,
  },
  fileIcon: { fontSize: 28, marginRight: 10 },
  headerInfo: { flex: 1 },
  fileSize: { fontSize: 13, color: theme.textSecondary },
  mimeBadge: {
    fontSize: 11,
    color: theme.textMuted,
    backgroundColor: theme.surfaceAlt,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
    overflow: 'hidden',
  },
  nameLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: theme.inputBg,
    color: theme.text,
    marginBottom: 8,
  },
  autoCompressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  autoCompressLabel: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  statusRow: { marginTop: 4 },
  statusText: { fontSize: 12, color: theme.textSecondary, marginBottom: 4 },
  successText: { fontSize: 12, color: theme.success, fontWeight: '600', marginTop: 4 },
  skipText: { fontSize: 12, color: theme.textMuted, marginTop: 4 },
  errorText: { fontSize: 12, color: theme.danger, fontWeight: '600', marginTop: 4 },
})
