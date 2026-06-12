import React from 'react'
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native'
import type { MonthSnapshot } from '../../../core/types'
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
  return (
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
          <TouchableOpacity style={styles.historyCard} onPress={() => onSelect(item)} onLongPress={() => {
            Alert.alert('Delete Archive', 'Delete this archive permanently?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => onDeleteSnapshot(item.archivedAt) },
            ])
          }} activeOpacity={0.7}>
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
    </View>
  )
}

interface SnapshotDetailProps {
  onBack: () => void;
  snapshot: MonthSnapshot;
}

export function SnapshotDetail({ snapshot, onBack }: SnapshotDetailProps) {
  return (
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
  )
}
