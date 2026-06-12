import React, { useState, useCallback, useEffect } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert } from 'react-native'
import { dbManager } from '../../../core/db/db-manager'
import type { MonthSnapshot } from '../../../core/types'
import { getCurrentMonth } from '../../../core/utils'
import { shouldArchive, archiveMonth } from '../domain/archive'
import { calculateAllTotals, type IncomeEntry } from '../domain/finance'
import { AccountHistoryModal, SnapshotDetail } from './AccountHistoryModal'
import { styles } from './AccountsScreen.styles'
import { IncomeSection } from './IncomeSection'
import { TotalsCard } from './TotalsCard'

const db = dbManager.getDB('accounts')

interface ExpenseItem {
  amount: number;
  id: string;
  label: string;
}

function isDuplicate(items: ExpenseItem[], label: string, excludeId?: string): boolean {
  return items.some((i) => i.label.toLowerCase() === label.toLowerCase() && i.id !== excludeId)
}

export function AccountsScreen() {
  const [incomes, setIncomes] = useState<IncomeEntry[]>(() => db.get('incomes') || [])
  const [fixedExpenses, setFixedExpenses] = useState<ExpenseItem[]>(() => db.get('fixedExpenses') || [])
  const [variableExpenses, setVariableExpenses] = useState<ExpenseItem[]>(() => db.get('variableExpenses') || [])

  useEffect(() => {
    dbManager.registerModule('accounts')
    const lastArchived = db.get('lastArchivedMonth')
    if (lastArchived && shouldArchive(lastArchived)) {
      const incomeItems: IncomeEntry[] = db.get('incomes') || []
      const fixedItems: ExpenseItem[] = db.get('fixedExpenses') || []
      const variableItems: ExpenseItem[] = db.get('variableExpenses') || []
      const result = archiveMonth(
        incomeItems,
        fixedItems.map((e) => e.amount),
        variableItems.map((e) => e.amount),
        fixedItems.map((e) => e.label),
        variableItems.map((e) => e.label),
      )
      db.set('lastArchivedMonth', getCurrentMonth())
      db.set('variableExpenses', [])
      setVariableExpenses([])
      const stored = db.get('snapshots') || []
      const newSnapshots = [...stored, result.snapshot]
      db.set('snapshots', newSnapshots)
      setSnapshots(newSnapshots)
    }
  }, [])

  // Expense form
  const [newLabel, setNewLabel] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [expenseType, setExpenseType] = useState<'fixed' | 'variable'>('fixed')

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editAmount, setEditAmount] = useState('')

  // History
  const [showHistory, setShowHistory] = useState(false)
  const [selectedSnapshot, setSelectedSnapshot] = useState<MonthSnapshot | null>(null)
  const [snapshots, setSnapshots] = useState<MonthSnapshot[]>(() => db.get('snapshots') || [])

  const persistIncomes = useCallback((items: IncomeEntry[]) => {
    setIncomes(items)
    db.set('incomes', items)
  }, [])

  const addExpense = useCallback(() => {
    const amount = parseFloat(newAmount)
    if (!newLabel || isNaN(amount)) {return}

    const target = expenseType === 'fixed' ? fixedExpenses : variableExpenses
    if (isDuplicate(target, newLabel)) {
      Alert.alert('Duplicate', `"${newLabel}" already exists in ${expenseType} expenses.`)
      return
    }

    const item: ExpenseItem = { id: `${Date.now()}`, label: newLabel, amount }
    if (expenseType === 'fixed') {
      setFixedExpenses((prev) => {
        const updated = [...prev, item]
        db.set('fixedExpenses', updated)
        return updated
      })
    } else {
      setVariableExpenses((prev) => {
        const updated = [...prev, item]
        db.set('variableExpenses', updated)
        return updated
      })
    }
    setNewLabel('')
    setNewAmount('')
  }, [newLabel, newAmount, expenseType, fixedExpenses, variableExpenses])

  const startEdit = (item: ExpenseItem) => {
    setEditingId(item.id)
    setEditLabel(item.label)
    setEditAmount(String(item.amount))
  }

  const saveEdit = (type: 'fixed' | 'variable') => {
    if (!editLabel || !editAmount) { setEditingId(null); return }
    const amount = parseFloat(editAmount)
    if (isNaN(amount)) {return}

    const items = type === 'fixed' ? fixedExpenses : variableExpenses
    if (isDuplicate(items, editLabel, editingId!)) {
      Alert.alert('Duplicate', `"${editLabel}" already exists.`)
      return
    }

    const updated = items.map((i) => i.id === editingId ? { ...i, label: editLabel, amount } : i)
    if (type === 'fixed') { setFixedExpenses(updated); db.set('fixedExpenses', updated) }
    else { setVariableExpenses(updated); db.set('variableExpenses', updated) }
    setEditingId(null)
  }

  const deleteExpense = (id: string, type: 'fixed' | 'variable') => {
    if (type === 'fixed') {
      setFixedExpenses((prev) => { const updated = prev.filter((i) => i.id !== id); db.set('fixedExpenses', updated); return updated })
    } else {
      setVariableExpenses((prev) => { const updated = prev.filter((i) => i.id !== id); db.set('variableExpenses', updated); return updated })
    }
  }

  const totals = calculateAllTotals({
    incomes,
    fixedExpenses: fixedExpenses.map((e) => e.amount),
    variableExpenses: variableExpenses.map((e) => e.amount),
  })

  const renderItem = (item: ExpenseItem, type: 'fixed' | 'variable') => {
    if (editingId === item.id) {
      return (
        <View style={styles.editRow}>
          <TextInput style={styles.editInput} value={editLabel} onChangeText={setEditLabel} />
          <TextInput style={styles.editInput} value={editAmount} onChangeText={setEditAmount} keyboardType="numeric" />
          <TouchableOpacity style={styles.saveBtn} onPress={() => saveEdit(type)}>
            <Text style={styles.saveBtnText}>✓</Text>
          </TouchableOpacity>
        </View>
      )
    }
    return (
      <TouchableOpacity style={styles.expenseRow} onPress={() => startEdit(item)} onLongPress={() => deleteExpense(item.id, type)} activeOpacity={0.7}>
        <Text style={styles.expenseLabel}>{item.label}</Text>
        <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
      </TouchableOpacity>
    )
  }

  const deleteSnapshot = useCallback((archivedAt: string) => {
    const updated = snapshots.filter((s) => s.archivedAt !== archivedAt)
    setSnapshots(updated)
    db.set('snapshots', updated)
  }, [snapshots])

  return (
    <View style={styles.container}>
      <IncomeSection incomes={incomes} onIncomesChange={persistIncomes} />

      <TotalsCard
        totalIncome={totals.totalIncome}
        fixedTotal={totals.fixedTotal}
        variableTotal={totals.variableTotal}
        remaining={totals.remaining}
      />

      <TouchableOpacity style={styles.historyBtn} onPress={() => setShowHistory(true)}>
        <Text style={styles.historyBtnText}>History</Text>
      </TouchableOpacity>

      <View style={styles.addRow}>
        <TextInput style={styles.inputSmall} value={newLabel} onChangeText={setNewLabel} placeholder="Label" placeholderTextColor="#666" />
        <TextInput style={styles.inputSmall} value={newAmount} onChangeText={setNewAmount} keyboardType="numeric" placeholder="Amount" placeholderTextColor="#666" />
      </View>
      <View style={styles.typeRow}>
        <TouchableOpacity style={[styles.typeBtn, expenseType === 'fixed' && styles.typeBtnActive]} onPress={() => setExpenseType('fixed')}>
          <Text style={[styles.typeBtnText, expenseType === 'fixed' && styles.typeBtnTextActive]}>Fixed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.typeBtn, expenseType === 'variable' && styles.typeBtnActive]} onPress={() => setExpenseType('variable')}>
          <Text style={[styles.typeBtnText, expenseType === 'variable' && styles.typeBtnTextActive]}>Variable</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addBtn} onPress={addExpense}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Fixed Expenses</Text>
      <FlatList data={fixedExpenses} keyExtractor={(item) => item.id} renderItem={({ item }) => renderItem(item, 'fixed')} />

      <Text style={styles.sectionTitle}>Variable Expenses</Text>
      <FlatList data={variableExpenses} keyExtractor={(item) => item.id} renderItem={({ item }) => renderItem(item, 'variable')} />

      {showHistory && !selectedSnapshot && (
        <AccountHistoryModal snapshots={snapshots} onSelect={setSelectedSnapshot} onClose={() => setShowHistory(false)} onDeleteSnapshot={deleteSnapshot} />
      )}

      {selectedSnapshot && (
        <SnapshotDetail snapshot={selectedSnapshot} onBack={() => setSelectedSnapshot(null)} />
      )}
    </View>
  )
}
