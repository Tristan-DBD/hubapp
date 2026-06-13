import React, { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, Vibration } from 'react-native'
import { ConfirmModal } from '../../../core/ui'
import type { TaskStoreData } from '../domain/types'
import { styles } from './TaskScreen.styles'

interface Props {
  data: TaskStoreData
  onAddCategory: (name: string) => void
  onDeleteCategory: (id: string) => void
  onSelectCategory: (id: string) => void
  onToggleView: () => void
  viewMode: 'grid' | 'list'
}

export function DashboardView({ data, onAddCategory, onDeleteCategory, onSelectCategory, onToggleView, viewMode }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const handleAdd = () => {
    if (newName.trim()) {
      onAddCategory(newName.trim())
      setNewName('')
      setShowModal(false)
    }
  }

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tâches</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'grid' && styles.toggleBtnActive]}
            onPress={onToggleView}
          >
            <Text style={[styles.toggleBtnText, viewMode === 'grid' && styles.toggleBtnTextActive]}>
              {viewMode === 'grid' ? '☰' : '▦'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {data.categories.length === 0 ? (
          <Text style={styles.emptyText}>Aucune catégorie. Créez-en une !</Text>
        ) : viewMode === 'grid' ? (
          <View style={styles.grid}>
            {data.categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryCard}
                onPress={() => onSelectCategory(cat.id)}
                onLongPress={() => {
                  Vibration.vibrate(10)
                  setDeleteTarget({ id: cat.id, name: cat.name })
                }}
              >
                <Text style={styles.categoryCardName}>{cat.name}</Text>
                <Text style={styles.categoryCardCount}>
                  {cat.lists.length} liste{cat.lists.length > 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <FlatList
            data={data.categories}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.categoryRow}
                onPress={() => onSelectCategory(item.id)}
                onLongPress={() => {
                  Vibration.vibrate(10)
                  setDeleteTarget({ id: item.id, name: item.name })
                }}
              >
                <Text style={styles.categoryRowName}>{item.name}</Text>
                <Text style={styles.categoryRowCount}>
                  {item.lists.length} liste{item.lists.length > 1 ? 's' : ''}
                </Text>
                <Text style={styles.backBtnText}>›</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      <ConfirmModal
        visible={!!deleteTarget}
        title="Supprimer"
        message={`Supprimer la catégorie "${deleteTarget?.name || ''}" ?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) { onDeleteCategory(deleteTarget.id) }
          setDeleteTarget(null)
        }}
      />

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nouvelle catégorie</Text>
            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Nom de la catégorie"
              placeholderTextColor="#555"
              autoFocus
              onSubmitEditing={handleAdd}
            />
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
