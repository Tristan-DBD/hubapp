import React, { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Modal } from 'react-native'
import type { MonthSnapshot } from '../../../core/types'
import { ConfirmModal } from '../../../core/ui'
import { styles } from './AccountsScreen.styles'

interface AccountHistoryModalProps {
  onClose: () => void;
  onDeleteSnapshot: (archivedAt: string) => void;
  onSelect: (snapshot: MonthSnapshot) => void;
  snapshots: MonthSnapshot[];
}

function incomeTotal(incomes: MonthSnapshot['incomes']): number {
  return incomes.reduce((s, i) => s + i.amount, 0)
}

export function AccountHistoryModal({ snapshots, onSelect, onClose, onDeleteSnapshot }: AccountHistoryModalProps) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.overlayHeader}>
          <Text style={styles.overlayTitle}>Archive History</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.overlayClose}>✕</Text>
          </TouchableOpacity>
        </View>
      <FlatList
        data={snapshots}
        keyExtractor={(item) => item.archivedAt}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.historyCard} onPress={() => onSelect(item)} onLongPress={() => setDeleteTarget(item.archivedAt)} activeOpacity={0.7}>
              <Text style={styles.historyMonth}>{item.month}</Text>
              <Text style={styles.historyDetail}>Income: ${incomeTotal(item.incomes)}</Text>
              <Text style={styles.historyDetail}>Fixed: ${item.totals.fixed}</Text>
              <Text style={styles.historyDetail}>Variable: ${item.totals.variable}</Text>
              <Text style={[styles.historyDetail, item.totals.remaining >= 0 ? styles.remainingPositive : styles.remainingNegative]}>
                Remaining: ${item.totals.remaining}
              </Text>
            </TouchableOpacity>
          )}
        ListEmptyComponent={<Text style={styles.historyEmpty}>No archives yet</Text>}
      />

      <ConfirmModal
        visible={!!deleteTarget}
        title="Supprimer"
        message="Supprimer cet archive définitivement ?"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) { onDeleteSnapshot(deleteTarget) }
          setDeleteTarget(null)
        }}
      />
      </View>
    </Modal>
  )
}

interface SnapshotDetailProps {
  onBack: () => void;
  snapshot: MonthSnapshot;
}

export function SnapshotDetail({ snapshot, onBack }: SnapshotDetailProps) {
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onBack}>
      <View style={styles.overlay}>
        <View style={styles.overlayHeader}>
          <Text style={styles.overlayTitle}>{snapshot.month}</Text>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.overlayClose}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.totalsCard}>
          <Text style={styles.totalText}>Income: ${incomeTotal(snapshot.incomes)}</Text>
          <Text style={styles.totalText}>Fixed: ${snapshot.totals.fixed}</Text>
          <Text style={styles.totalText}>Variable: ${snapshot.totals.variable}</Text>
          <Text style={[styles.remainingText, snapshot.totals.remaining >= 0 ? styles.remainingPositive : styles.remainingNegative]}>
            Remaining: ${snapshot.totals.remaining}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Income Sources</Text>
        <FlatList
          data={snapshot.incomes}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <View style={styles.expenseRow}>
              <Text style={styles.expenseLabel}>{item.label}</Text>
              <Text style={styles.expenseAmount}>${item.amount}</Text>
            </View>
          )}
        />

        <Text style={styles.sectionTitle}>Fixed Expenses</Text>
        <FlatList
          data={snapshot.fixedExpenses}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <View style={styles.expenseRow}>
              <Text style={styles.expenseLabel}>{item.label}</Text>
              <Text style={styles.expenseAmount}>${item.amount}</Text>
            </View>
          )}
        />

        <Text style={styles.sectionTitle}>Variable Expenses</Text>
        <FlatList
          data={snapshot.variableExpenses}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <View style={styles.expenseRow}>
              <Text style={styles.expenseLabel}>{item.label}</Text>
              <Text style={styles.expenseAmount}>${item.amount}</Text>
            </View>
          )}
        />
      </View>
    </Modal>
  )
}
