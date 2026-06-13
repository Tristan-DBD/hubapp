import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert, BackHandler, KeyboardAvoidingView, Platform, Vibration, LayoutAnimation } from 'react-native'
import { dbManager } from '../../../core/db/db-manager'
import type { MonthSnapshot } from '../../../core/types'
import { ConfirmModal } from '../../../core/ui'
import { getCurrentMonth } from '../../../core/utils'
import { shouldArchive, archiveMonth } from '../domain/archive'
import { calculateAllTotals, isDuplicateLabel, type IncomeEntry } from '../domain/finance'
import { AccountHistoryModal, SnapshotDetail } from './AccountHistoryModal'
import { styles } from './AccountsScreen.styles'
import { IncomeSection } from './IncomeSection'
import { TotalsCard } from './TotalsCard'

interface ExpenseItem {
  amount: number;
  id: string;
  label: string;
}

export function AccountsScreen() {
  const db = useMemo(() => dbManager.getDB('accounts'), [])
  const [incomes, setIncomes] = useState<IncomeEntry[]>(() => db.get('incomes') || [])
  const [fixedExpenses, setFixedExpenses] = useState<ExpenseItem[]>(() => db.get('fixedExpenses') || [])
  const [variableExpenses, setVariableExpenses] = useState<ExpenseItem[]>(() => db.get('variableExpenses') || [])

  useEffect(() => {
    dbManager.registerModule('accounts')
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert('Quitter', 'Voulez-vous quitter les comptes ?', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Quitter', style: 'destructive', onPress: () => BackHandler.exitApp() },
      ])
      return true
    })

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

    return () => sub.remove()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Expense form
  const [newLabel, setNewLabel] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [expenseType, setExpenseType] = useState<'fixed' | 'variable'>('fixed')
  const newLabelRef = useRef<TextInput>(null)
  const newAmountRef = useRef<TextInput>(null)
  const editLabelRef = useRef<TextInput>(null)
  const editAmountRef = useRef<TextInput>(null)

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editAmount, setEditAmount] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string; type: 'fixed' | 'variable' } | null>(null)

  // History
  const [showHistory, setShowHistory] = useState(false)
  const [selectedSnapshot, setSelectedSnapshot] = useState<MonthSnapshot | null>(null)
  const [snapshots, setSnapshots] = useState<MonthSnapshot[]>(() => db.get('snapshots') || [])

  const persistIncomes = useCallback((items: IncomeEntry[]) => {
    setIncomes(items)
    db.set('incomes', items)
  }, [db])

  const addExpense = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    const amount = parseFloat(newAmount)
    if (!newLabel || isNaN(amount)) {return}

    const target = expenseType === 'fixed' ? fixedExpenses : variableExpenses
    if (isDuplicateLabel(target, newLabel)) {
      Alert.alert('Doublon', `"${newLabel}" existe déjà dans les dépenses ${expenseType === 'fixed' ? 'fixes' : 'variables'}.`)
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
  }, [newLabel, newAmount, expenseType, fixedExpenses, variableExpenses, db])

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
    if (isDuplicateLabel(items, editLabel, editingId!)) {
      Alert.alert('Doublon', `"${editLabel}" existe déjà.`)
      return
    }

    const updated = items.map((i) => i.id === editingId ? { ...i, label: editLabel, amount } : i)
    if (type === 'fixed') { setFixedExpenses(updated); db.set('fixedExpenses', updated) }
    else { setVariableExpenses(updated); db.set('variableExpenses', updated) }
    setEditingId(null)
  }

  const deleteExpense = (id: string, type: 'fixed' | 'variable') => {
    const label = (type === 'fixed' ? fixedExpenses : variableExpenses).find((i) => i.id === id)?.label || ''
    setDeleteTarget({ id, type, label })
  }

  const confirmDeleteExpense = () => {
    if (!deleteTarget) { return }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    if (deleteTarget.type === 'fixed') {
      setFixedExpenses((prev) => { const updated = prev.filter((i) => i.id !== deleteTarget.id); db.set('fixedExpenses', updated); return updated })
    } else {
      setVariableExpenses((prev) => { const updated = prev.filter((i) => i.id !== deleteTarget.id); db.set('variableExpenses', updated); return updated })
    }
    setDeleteTarget(null)
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
            onSubmitEditing={() => saveEdit(type)}
            blurOnSubmit
          />
          <TouchableOpacity style={styles.saveBtn} onPress={() => saveEdit(type)}>
            <Text style={styles.saveBtnText}>✓</Text>
          </TouchableOpacity>
        </View>
      )
    }
    return (
      <TouchableOpacity style={styles.expenseRow} onPress={() => startEdit(item)} onLongPress={() => { Vibration.vibrate(10); deleteExpense(item.id, type) }} activeOpacity={0.7}>
        <Text style={styles.expenseLabel}>{item.label}</Text>
        <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
      </TouchableOpacity>
    )
  }

  const deleteSnapshot = useCallback((archivedAt: string) => {
    const updated = snapshots.filter((s) => s.archivedAt !== archivedAt)
    setSnapshots(updated)
    db.set('snapshots', updated)
  }, [snapshots, db])

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <IncomeSection incomes={incomes} onIncomesChange={persistIncomes} />

      <TotalsCard
        totalIncome={totals.totalIncome}
        fixedTotal={totals.fixedTotal}
        variableTotal={totals.variableTotal}
        remaining={totals.remaining}
      />

      <TouchableOpacity style={styles.historyBtn} onPress={() => setShowHistory(true)}>
        <Text style={styles.historyBtnText}>Historique</Text>
      </TouchableOpacity>

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
          onSubmitEditing={addExpense}
          blurOnSubmit
        />
      </View>
      <View style={styles.typeRow}>
        <TouchableOpacity style={[styles.typeBtn, expenseType === 'fixed' && styles.typeBtnActive]} onPress={() => setExpenseType('fixed')}>
          <Text style={[styles.typeBtnText, expenseType === 'fixed' && styles.typeBtnTextActive]}>Fixes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.typeBtn, expenseType === 'variable' && styles.typeBtnActive]} onPress={() => setExpenseType('variable')}>
          <Text style={[styles.typeBtnText, expenseType === 'variable' && styles.typeBtnTextActive]}>Variables</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addBtn} onPress={addExpense}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Dépenses fixes</Text>
      <FlatList data={fixedExpenses} keyExtractor={(item) => item.id} renderItem={({ item }) => renderItem(item, 'fixed')} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" />

      <Text style={styles.sectionTitle}>Dépenses variables</Text>
      <FlatList data={variableExpenses} keyExtractor={(item) => item.id} renderItem={({ item }) => renderItem(item, 'variable')} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" />

      {showHistory && !selectedSnapshot && (
        <AccountHistoryModal snapshots={snapshots} onSelect={setSelectedSnapshot} onClose={() => setShowHistory(false)} onDeleteSnapshot={deleteSnapshot} />
      )}

      {selectedSnapshot && (
        <SnapshotDetail snapshot={selectedSnapshot} onBack={() => setSelectedSnapshot(null)} />
      )}

      <ConfirmModal
        visible={!!deleteTarget}
        title="Supprimer"
        message={`Supprimer la dépense "${deleteTarget?.label || ''}" ?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteExpense}
      />
    </KeyboardAvoidingView>
  )
}
