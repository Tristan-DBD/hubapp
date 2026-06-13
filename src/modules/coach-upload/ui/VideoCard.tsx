import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
} from 'react-native'
import { useSlideOut } from '../../../core/hooks/useSlideOut'
import { theme } from '../../../core/theme'
import { ProgressBar } from '../../../core/ui'
import type { VideoItem } from '../domain/types'

interface VideoCardProps {
  onDelete: () => void;
  onPressName: () => void;
  onRemove?: () => void;
  onToggleCompression?: () => void;
  video: VideoItem;
}

export const VideoCard = React.memo(function VideoCardInner({ video, onPressName, onDelete, onRemove, onToggleCompression }: VideoCardProps) {
  const finalName = video.finalName || video.fileName
  const translateX = useSlideOut(video.uploadStatus === 'uploaded', onRemove)

  return (
    <Animated.View style={[styles.card, { transform: [{ translateX }] }]}>
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>

      {video.thumbnailUri && (
        <Image
          source={{ uri: video.thumbnailUri }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      )}

      <Text style={styles.fileName} numberOfLines={1}>{video.fileName}</Text>

      <TouchableOpacity style={styles.nameRow} onPress={onPressName}>
        <Text style={styles.nameLabel}>Nom final :</Text>
        <Text style={[styles.nameValue, !finalName && styles.namePlaceholder]}>
          {finalName || 'Appuyez pour définir'}
        </Text>
      </TouchableOpacity>

      {video.compressionStatus === 'pending' && (
        <TouchableOpacity style={styles.autoCompressRow} onPress={onToggleCompression}>
          <View style={[styles.checkbox, !video.skipCompression && styles.checkboxActive]}>
            {!video.skipCompression && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.autoCompressLabel}>Compresser</Text>
        </TouchableOpacity>
      )}

      {video.compressionStatus === 'compressing' && (
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>Compression...</Text>
          <ProgressBar progress={video.compressionProgress} color={theme.primary} />
        </View>
      )}
      {video.compressionStatus === 'compressed' && (
        <Text style={styles.successText}>Compression terminée ✓</Text>
      )}
      {video.compressionStatus === 'error' && (
        <Text style={styles.errorText}>Erreur compression : {video.error}</Text>
      )}

      {video.uploadStatus === 'uploading' && (
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>Upload...</Text>
          <ProgressBar progress={video.uploadProgress} color={theme.success} />
        </View>
      )}
      {video.uploadStatus === 'uploaded' && (
        <Text style={styles.successText}>Upload terminé ✓</Text>
      )}
      {video.uploadStatus === 'error' && (
        <Text style={styles.errorText}>Erreur upload : {video.error}</Text>
      )}
    </Animated.View>
  )
})

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
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
  fileName: {
    fontSize: 13,
    color: theme.textMuted,
    marginBottom: 8,
    paddingRight: 36,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: theme.surfaceAlt,
    borderRadius: 8,
  },
  nameLabel: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  nameValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.primaryLight,
    flex: 1,
  },
  namePlaceholder: {
    color: theme.textMuted,
    fontWeight: 'normal',
    fontStyle: 'italic',
  },
  statusRow: {
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  successText: {
    fontSize: 12,
    color: theme.success,
    fontWeight: '600',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: theme.danger,
    fontWeight: '600',
    marginTop: 4,
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
})
