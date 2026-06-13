import React from 'react'
import { View, Text, TouchableOpacity, Modal } from 'react-native'
import { styles } from './TaskScreen.styles'

interface Props {
  itemId: string | null
  onClose: () => void
  onConfirm: (id: string) => void
}

export function DeleteConfirmModal({ itemId, onClose, onConfirm }: Props) {
  return (
    <Modal visible={!!itemId} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayBg} activeOpacity={1} onPress={onClose} />
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Supprimer</Text>
          <Text style={styles.confirmMessage}>
            Êtes-vous sûr de vouloir supprimer cet élément ?
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>Non</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dangerBtn} onPress={() => { if (itemId) { onConfirm(itemId); onClose() } }}>
              <Text style={styles.dangerBtnText}>Oui</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}
