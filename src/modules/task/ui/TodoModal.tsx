import React, { useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native'
import type { Priority, TodoStatus } from '../domain/types'
import { PRIORITIES, PRIORITY_LABELS, STATUES, STATUS_LABELS } from '../domain/types'
import { styles } from './TaskScreen.styles'

interface Props {
  onAdd: (title: string, extras?: { description?: string; priority?: Priority; status?: TodoStatus }) => void
  onClose: () => void
  visible: boolean
}

export function TodoModal({ visible, onClose, onAdd }: Props) {
  const [todoTitle, setTodoTitle] = React.useState('')
  const [todoDesc, setTodoDesc] = React.useState('')
  const [todoPriority, setTodoPriority] = React.useState<Priority>('normal')
  const [todoStatus, setTodoStatus] = React.useState<TodoStatus>('pending')
  const titleRef = useRef<TextInput>(null)
  const descRef = useRef<TextInput>(null)

  const handleAdd = () => {
    if (todoTitle.trim()) {
      onAdd(todoTitle.trim(), { description: todoDesc.trim() || undefined, priority: todoPriority, status: todoStatus })
      setTodoTitle('')
      setTodoDesc('')
      setTodoPriority('normal')
      setTodoStatus('pending')
      onClose()
    }
  }

  const handleClose = () => {
    setTodoTitle('')
    setTodoDesc('')
    setTodoPriority('normal')
    setTodoStatus('pending')
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayBg} activeOpacity={1} onPress={handleClose} />
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Nouvel élément</Text>

          <TextInput
            style={styles.modalInput}
            value={todoTitle}
            onChangeText={setTodoTitle}
            placeholder="Titre"
            placeholderTextColor="#555"
            autoFocus
            ref={titleRef}
            returnKeyType="next"
            onSubmitEditing={() => descRef.current?.focus()}
            blurOnSubmit={false}
          />

          <TextInput
            style={[styles.modalInput, styles.modalTextArea]}
            value={todoDesc}
            onChangeText={setTodoDesc}
            placeholder="Description (optionnelle)"
            placeholderTextColor="#555"
            multiline
            ref={descRef}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
            blurOnSubmit
          />

          <Text style={styles.modalSubtitle}>Priorité</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.todoBadgeBtn, todoPriority === p && styles.todoBadgeBtnActive]}
                onPress={() => setTodoPriority(p)}
              >
                <Text style={styles.todoBadgeBtnText}>{PRIORITY_LABELS[p]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.modalSubtitle}>État</Text>
          <View style={styles.typePickerRow}>
            {STATUES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.typePickerBtn, todoStatus === s && styles.typePickerBtnActive]}
                onPress={() => setTodoStatus(s)}
              >
                <Text style={[styles.typePickerBtnText, todoStatus === s && styles.typePickerBtnTextActive]}>
                  {STATUS_LABELS[s]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={handleClose}>
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleAdd}>
              <Text style={styles.modalConfirmText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}
