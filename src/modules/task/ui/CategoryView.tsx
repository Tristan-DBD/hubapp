import React, { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, Vibration } from 'react-native'
import { ConfirmModal } from '../../../core/ui'
import type { TaskStoreData, ListType } from '../domain/types'
import { LIST_TYPE_LABELS } from '../domain/types'
import { styles } from './TaskScreen.styles'

interface Props {
  categoryId: string
  data: TaskStoreData
  onAddList: (name: string, type: ListType) => void
  onBack: () => void
  onDeleteList: (listId: string) => void
  onSelectList: (listId: string) => void
}

const LIST_TYPES: ListType[] = ['checklist', 'simple', 'todo']

export function CategoryView({ categoryId, data, onAddList, onBack, onDeleteList, onSelectList }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedType, setSelectedType] = useState<ListType>('checklist')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const category = data.categories.find((c) => c.id === categoryId)
  if (!category) { return null }

  const handleAdd = () => {
    if (newName.trim()) {
      onAddList(newName.trim(), selectedType)
      setNewName('')
      setSelectedType('checklist')
      setShowModal(false)
    }
  }

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category.name}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {category.lists.length === 0 ? (
          <Text style={styles.emptyText}>Aucune liste dans cette catégorie.</Text>
        ) : (
          <FlatList
            data={category.lists}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listCard}
                onPress={() => onSelectList(item.id)}
                onLongPress={() => {
                  Vibration.vibrate(10)
                  setDeleteTarget({ id: item.id, name: item.name })
                }}
              >
                <Text style={styles.listCardName}>{item.name}</Text>
                <Text style={styles.listCardType}>{LIST_TYPE_LABELS[item.type]}</Text>
                <Text style={styles.listCardCount}>
                  {item.items.length} élément{item.items.length > 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      <ConfirmModal
        visible={!!deleteTarget}
        title="Supprimer"
        message={`Supprimer la liste "${deleteTarget?.name || ''}" ?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) { onDeleteList(deleteTarget.id) }
          setDeleteTarget(null)
        }}
      />

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nouvelle liste</Text>
            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Nom de la liste"
              placeholderTextColor="#555"
              autoFocus
              onSubmitEditing={handleAdd}
            />
            <Text style={styles.modalSubtitle}>Type</Text>
            <View style={styles.typePickerRow}>
              {LIST_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typePickerBtn, selectedType === t && styles.typePickerBtnActive]}
                  onPress={() => setSelectedType(t)}
                >
                  <Text style={[styles.typePickerBtnText, selectedType === t && styles.typePickerBtnTextActive]}>
                    {LIST_TYPE_LABELS[t]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setShowModal(false); setNewName('') }}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleAdd}>
                <Text style={styles.modalConfirmText}>Créer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}
