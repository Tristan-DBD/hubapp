import React, { useState, useCallback, useRef } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert, Vibration, LayoutAnimation } from 'react-native'
import { ConfirmModal } from '../../../core/ui'
import { type IncomeEntry, isDuplicateLabel } from '../domain/finance'
import { styles } from './AccountsScreen.styles'

interface IncomeSectionProps {
  incomes: IncomeEntry[];
  onIncomesChange: (incomes: IncomeEntry[]) => void;
}

export function IncomeSection({ incomes, onIncomesChange }: IncomeSectionProps) {
  const [newLabel, setNewLabel] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const newLabelRef = useRef<TextInput>(null)
  const newAmountRef = useRef<TextInput>(null)
  const editLabelRef = useRef<TextInput>(null)
  const editAmountRef = useRef<TextInput>(null)

  const addIncome = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    const amount = parseFloat(newAmount)
    if (!newLabel || isNaN(amount)) {return}

    if (isDuplicateLabel(incomes, newLabel)) {
      Alert.alert('Doublon', `"${newLabel}" existe déjà dans les revenus.`)
      return
    }

    const item: IncomeEntry = { id: `${Date.now()}`, label: newLabel, amount }
    onIncomesChange([...incomes, item])
    setNewLabel('')
    setNewAmount('')
  }, [newLabel, newAmount, incomes, onIncomesChange])

  const startEdit = (item: IncomeEntry) => {
    setEditingId(item.id)
    setEditLabel(item.label)
    setEditAmount(String(item.amount))
  }

  const saveEdit = () => {
    if (!editLabel || !editAmount) { setEditingId(null); return }
    const amount = parseFloat(editAmount)
    if (isNaN(amount)) {return}

    if (isDuplicateLabel(incomes, editLabel, editingId!)) {
      Alert.alert('Doublon', `"${editLabel}" existe déjà.`)
      return
    }

    onIncomesChange(incomes.map((i) => i.id === editingId ? { ...i, label: editLabel, amount } : i))
    setEditingId(null)
  }

  const deleteIncome = (id: string) => {
    const label = incomes.find((i) => i.id === id)?.label || ''
    setDeleteTarget({ id, label })
  }

  const confirmDeleteIncome = () => {
    if (!deleteTarget) { return }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    onIncomesChange(incomes.filter((i) => i.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const renderItem = (item: IncomeEntry) => {
    if (editingId === item.id) {
      return (
        <View style={styles.editRow}>
          <TextInput
            style={styles.editInput}
            value={editLabel}
            onChangeText={setEditLabel}
            ref={editLabelRef}
            returnKeyType="next"
            onSubmitEditing={() => editAmountRef.current?.focus()}
            blurOnSubmit={false}
          />
          <TextInput
            style={styles.editInput}
            value={editAmount}
            onChangeText={setEditAmount}
            keyboardType="numeric"
            ref={editAmountRef}
            returnKeyType="done"
            onSubmitEditing={saveEdit}
            blurOnSubmit
          />
          <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
            <Text style={styles.saveBtnText}>✓</Text>
          </TouchableOpacity>
        </View>
      )
    }
    return (
      <TouchableOpacity style={styles.expenseRow} onPress={() => startEdit(item)} onLongPress={() => { Vibration.vibrate(10); deleteIncome(item.id) }} activeOpacity={0.7}>
        <Text style={styles.expenseLabel}>{item.label}</Text>
        <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <>
      <Text style={styles.sectionTitle}>Revenus</Text>
      <View style={styles.addRow}>
        <TextInput
          style={styles.inputSmall}
          value={newLabel}
          onChangeText={setNewLabel}
          placeholder="Libellé"
          placeholderTextColor="#666"
          ref={newLabelRef}
          returnKeyType="next"
          onSubmitEditing={() => newAmountRef.current?.focus()}
          blurOnSubmit={false}
        />
        <TextInput
          style={styles.inputSmall}
          value={newAmount}
          onChangeText={setNewAmount}
          keyboardType="numeric"
          placeholder="Montant"
          placeholderTextColor="#666"
          ref={newAmountRef}
          returnKeyType="done"
          onSubmitEditing={addIncome}
          blurOnSubmit
        />
        <TouchableOpacity style={styles.addBtn} onPress={addIncome}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <FlatList data={incomes} keyExtractor={(item) => item.id} renderItem={({ item }) => renderItem(item)} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" />

      <ConfirmModal
        visible={!!deleteTarget}
        title="Supprimer"
        message={`Supprimer le revenu "${deleteTarget?.label || ''}" ?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteIncome}
      />
    </>
  )
}
