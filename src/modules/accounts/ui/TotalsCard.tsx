import React from 'react'
import { View, Text } from 'react-native'
import { styles } from './AccountsScreen.styles'

interface TotalsCardProps {
  fixedTotal: number;
  remaining: number;
  totalIncome: number;
  variableTotal: number;
}

export function TotalsCard({ totalIncome, fixedTotal, variableTotal, remaining }: TotalsCardProps) {
  return (
    <View style={styles.totalsCard}>
      <Text style={styles.totalText}>Income: ${totalIncome.toFixed(2)}</Text>
      <Text style={styles.totalText}>Fixed: ${fixedTotal.toFixed(2)}</Text>
      <Text style={styles.totalText}>Variable: ${variableTotal.toFixed(2)}</Text>
      <Text style={[styles.remainingText, remaining >= 0 ? styles.remainingPositive : styles.remainingNegative]}>
        Remaining: ${remaining.toFixed(2)}
      </Text>
    </View>
  )
}
