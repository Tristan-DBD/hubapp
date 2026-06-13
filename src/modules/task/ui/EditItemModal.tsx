import React from 'react'
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native'
import { styles } from './TaskScreen.styles'

interface Props {
  item: { id: string; title: string } | null
  onClose: () => void
  onSave: (id: string, title: string) => void
}

export function EditItemModal({ item, onClose, onSave }: Props) {
  const [title, setTitle] = React.useState('')

  React.useEffect(() => {
    if (item) {setTitle(item.title)}
  }, [item])

  const handleSave = () => {
    if (item && title.trim()) { onSave(item.id, title.trim()); onClose() }
  }

  return (
    <Modal visible={!!item} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayBg} activeOpacity={1} onPress={onClose} />
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Modifier</Text>
          <TextInput
            style={styles.modalInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Nouveau nom"
            placeholderTextColor="#555"
            autoFocus
            onSubmitEditing={handleSave}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleSave}>
              <Text style={styles.modalConfirmText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}
