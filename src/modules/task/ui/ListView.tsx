import React, { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput, SectionList, Vibration } from 'react-native'
import { ConfirmModal } from '../../../core/ui'
import type { TaskStoreData, TodoStatus, Priority, ItemData } from '../domain/types'
import { PRIORITY_ORDER, PRIORITY_LABELS, STATUS_LABELS, STATUES } from '../domain/types'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { EditItemModal } from './EditItemModal'
import { StatusChangeModal } from './StatusChangeModal'
import { styles } from './TaskScreen.styles'
import { TodoModal } from './TodoModal'

interface Props {
  categoryId: string
  data: TaskStoreData
  listId: string
  onAddItem: (title: string, extras?: { description?: string; priority?: Priority; status?: TodoStatus }) => void
  onBack: () => void
  onDeleteItem: (itemId: string) => void
  onRenameItem: (itemId: string, title: string) => void
  onToggleCheck: (itemId: string) => void
  onUpdateStatus: (itemId: string, status: TodoStatus) => void
}

export function ListView({ categoryId, data, listId, onAddItem, onBack, onDeleteItem, onRenameItem, onToggleCheck, onUpdateStatus }: Props) {
  const [showTodoModal, setShowTodoModal] = useState(false)
  const [statusItemId, setStatusItemId] = useState<string | null>(null)
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)
  const [inlineInput, setInlineInput] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [editingItem, setEditingItem] = useState<{ id: string; title: string } | null>(null)

  const category = data.categories.find((c) => c.id === categoryId)
  const list = category?.lists.find((l) => l.id === listId)
  if (!list) { return null }

  const handleInlineAdd = () => {
    if (inlineInput.trim()) { onAddItem(inlineInput.trim()); setInlineInput('') }
  }

  const handleTodoAdd = (title: string, extras?: { description?: string; priority?: Priority; status?: TodoStatus }) => {
    onAddItem(title, extras)
  }

  const checklistSections = [
    { title: 'À faire', data: list.items.filter((i) => !i.checked).sort((a, b) => a.order - b.order) },
    { title: 'Fait', data: list.items.filter((i) => i.checked).sort((a, b) => a.order - b.order) },
  ].filter((s) => s.data.length > 0)

  const sortedSimple = [...list.items].sort((a, b) => a.order - b.order)

  const todoSections = STATUES
    .map((status) => ({
      title: STATUS_LABELS[status],
      data: list.items.filter((item) => (item.status || 'pending') === status).sort((a, b) => {
        return PRIORITY_ORDER[a.priority || 'normal'] - PRIORITY_ORDER[b.priority || 'normal']
      }),
    }))
    .filter((s) => s.data.length > 0)

  const priorityBadge = (p?: Priority) =>
    p === 'high' ? styles.priorityHigh : p === 'low' ? styles.priorityLow : styles.priorityNormal

  const renderChecklistItem = (item: ItemData) => (
    <TouchableOpacity style={styles.checklistRow} onPress={() => onToggleCheck(item.id)} onLongPress={() => { Vibration.vibrate(10); setDeleteTarget({ id: item.id, title: item.title }) }}>
      <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
        {item.checked && <Text style={styles.checkboxInner}>✓</Text>}
      </View>
      <Text style={[styles.checklistTitle, item.checked && styles.checklistTitleDone]}>{item.title}</Text>
    </TouchableOpacity>
  )

  const renderSimpleItem = (item: ItemData) => (
    <TouchableOpacity style={styles.simpleRow} onPress={() => setEditingItem({ id: item.id, title: item.title })} onLongPress={() => { Vibration.vibrate(10); setDeleteTarget({ id: item.id, title: item.title }) }}>
      <Text style={styles.simpleTitle}>{item.title}</Text>
    </TouchableOpacity>
  )

  const renderTodoItem = (item: ItemData) => (
    <TouchableOpacity style={styles.todoRow} onLongPress={() => setStatusItemId(item.id)}>
      <View style={styles.todoHeader}>
        <Text style={styles.todoTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.todoBadgeRow}>
          <Text style={[styles.todoBadge, priorityBadge(item.priority)]}>{PRIORITY_LABELS[item.priority || 'normal']}</Text>
          <Text style={styles.todoBadgeStatus}>{STATUS_LABELS[item.status || 'pending']}</Text>
        </View>
      </View>
      {item.description ? <Text style={styles.todoDesc} numberOfLines={2}>{item.description}</Text> : null}
    </TouchableOpacity>
  )

  const listTitle = `${category!.name} › ${list.name}`

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{listTitle}</Text>
      </View>

      <View style={styles.content}>
        {list.type === 'todo' ? (
          <>
            <TouchableOpacity style={styles.inlineAddRow} onPress={() => setShowTodoModal(true)}>
              <Text style={[styles.inlineInput, styles.inlineInputPlaceholder]}>+ Ajouter un élément</Text>
            </TouchableOpacity>
            <SectionList style={styles.list} sections={todoSections} keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
              renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
              renderItem={({ item }) => renderTodoItem(item)}
              ListEmptyComponent={<Text style={styles.emptyText}>Aucun élément</Text>}
            />
          </>
        ) : (
          <>
            <View style={styles.inlineAddRow}>
              <TextInput style={styles.inlineInput} value={inlineInput} onChangeText={setInlineInput}
                placeholder={list.type === 'checklist' ? 'Nouvel élément...' : 'Nouveau rappel...'}
                placeholderTextColor="#555" onSubmitEditing={handleInlineAdd} returnKeyType="done"
              />
              <TouchableOpacity style={styles.inlineAddIcon} onPress={handleInlineAdd}>
                <Text style={styles.inlineAddIconText}>+</Text>
              </TouchableOpacity>
            </View>
            {list.type === 'checklist' ? (
              <SectionList style={styles.list} sections={checklistSections} keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
                renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
                renderItem={({ item }) => renderChecklistItem(item)}
                ListEmptyComponent={<Text style={styles.emptyText}>Aucun élément</Text>}
              />
            ) : (
              <FlatList style={styles.list} data={sortedSimple} keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
                renderItem={({ item }) => renderSimpleItem(item)}
                ListEmptyComponent={<Text style={styles.emptyText}>Aucun élément</Text>}
              />
            )}
          </>
        )}
      </View>

      <EditItemModal item={editingItem} onClose={() => setEditingItem(null)} onSave={(id, title) => onRenameItem(id, title)} />
      <TodoModal visible={showTodoModal} onClose={() => setShowTodoModal(false)} onAdd={handleTodoAdd} />
      <StatusChangeModal itemId={statusItemId} onClose={() => setStatusItemId(null)} onUpdateStatus={onUpdateStatus} onDeleteRequest={(id) => { setDeleteItemId(id); setStatusItemId(null) }} />
      <DeleteConfirmModal itemId={deleteItemId} onClose={() => setDeleteItemId(null)} onConfirm={(id) => onDeleteItem(id)} />

      <ConfirmModal
        visible={!!deleteTarget}
        title="Supprimer"
        message={`Supprimer "${deleteTarget?.title || ''}" ?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { onDeleteItem(deleteTarget.id) }; setDeleteTarget(null) }}
      />
    </>
  )
}
