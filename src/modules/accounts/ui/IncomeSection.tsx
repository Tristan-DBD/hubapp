import React, { useState, useCallback } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert } from 'react-native'
import type { IncomeEntry } from '../domain/finance'
import { styles } from './AccountsScreen.styles'

interface IncomeSectionProps {
  incomes: IncomeEntry[];
  onIncomesChange: (incomes: IncomeEntry[]) => void;
}

function isDuplicate(items: IncomeEntry[], label: string, excludeId?: string): boolean {
  return items.some((i) => i.label.toLowerCase() === label.toLowerCase() && i.id !== excludeId)
}

export function IncomeSection({ incomes, onIncomesChange }: IncomeSectionProps) {
  const [newLabel, setNewLabel] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editAmount, setEditAmount] = useState('')

  const addIncome = useCallback(() => {
    const amount = parseFloat(newAmount)
    if (!newLabel || isNaN(amount)) {return}

    if (isDuplicate(incomes, newLabel)) {
      Alert.alert('Duplicate', `"${newLabel}" already exists in incomes.`)
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

    if (isDuplicate(incomes, editLabel, editingId!)) {
      Alert.alert('Duplicate', `"${editLabel}" already exists.`)
      return
    }

    onIncomesChange(incomes.map((i) => i.id === editingId ? { ...i, label: editLabel, amount } : i))
    setEditingId(null)
  }

  const deleteIncome = (id: string) => {
    onIncomesChange(incomes.filter((i) => i.id !== id))
  }

  const renderItem = (item: IncomeEntry) => {
    if (editingId === item.id) {
      return (
        <View style={styles.editRow}>
          <TextInput style={styles.editInput} value={editLabel} onChangeText={setEditLabel} />
          <TextInput style={styles.editInput} value={editAmount} onChangeText={setEditAmount} keyboardType="numeric" />
          <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
            <Text style={styles.saveBtnText}>✓</Text>
          </TouchableOpacity>
        </View>
      )
    }
    return (
      <TouchableOpacity style={styles.expenseRow} onPress={() => startEdit(item)} onLongPress={() => deleteIncome(item.id)} activeOpacity={0.7}>
        <Text style={styles.expenseLabel}>{item.label}</Text>
        <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <>
      <Text style={styles.sectionTitle}>Income</Text>
      <View style={styles.addRow}>
        <TextInput style={styles.inputSmall} value={newLabel} onChangeText={setNewLabel} placeholder="Label" placeholderTextColor="#666" />
        <TextInput style={styles.inputSmall} value={newAmount} onChangeText={setNewAmount} keyboardType="numeric" placeholder="Amount" placeholderTextColor="#666" />
        <TouchableOpacity style={styles.addBtn} onPress={addIncome}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <FlatList data={incomes} keyExtractor={(item) => item.id} renderItem={({ item }) => renderItem(item)} />
    </>
  )
}
