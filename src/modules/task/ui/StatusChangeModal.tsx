import React from 'react'
import { View, Text, TouchableOpacity, Modal } from 'react-native'
import type { TodoStatus } from '../domain/types'
import { STATUES, STATUS_LABELS } from '../domain/types'
import { styles } from './TaskScreen.styles'

interface Props {
  itemId: string | null
  onClose: () => void
  onDeleteRequest: (id: string) => void
  onUpdateStatus: (id: string, status: TodoStatus) => void
}

export function StatusChangeModal({ itemId, onClose, onUpdateStatus, onDeleteRequest }: Props) {
  const handleSelect = (s: TodoStatus) => {
    if (itemId) { onUpdateStatus(itemId, s) }
    onClose()
  }

  const handleDelete = () => {
    if (itemId) { onDeleteRequest(itemId) }
    onClose()
  }

  return (
    <Modal visible={!!itemId} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayBg} activeOpacity={1} onPress={onClose} />
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Changer l'état</Text>
          {STATUES.map((s) => (
            <TouchableOpacity key={s} style={styles.statusOption} onPress={() => handleSelect(s)}>
              <Text style={styles.statusOptionText}>{STATUS_LABELS[s]}</Text>
            </TouchableOpacity>
          ))}

          <View style={styles.separator} />

          <TouchableOpacity style={styles.statusOption} onPress={handleDelete}>
            <Text style={[styles.statusOptionText, styles.statusDanger]}>Supprimer</Text>
          </TouchableOpacity>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}
