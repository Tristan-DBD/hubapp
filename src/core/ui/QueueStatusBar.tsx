import React from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { theme } from '../theme'

interface QueueStatusBarProps {
  errors: number
  pending: number
  progressText: string | null
  running: boolean
  total: number
  uploaded: number
}

export function QueueStatusBar({ total, pending, uploaded, errors, running, progressText }: QueueStatusBarProps) {
  if (total === 0) {return null}

  const parts: string[] = []
  if (running && progressText) {
    parts.push(progressText)
  } else {
    if (pending > 0) {parts.push(`${pending} en attente`)}
    if (uploaded > 0) {parts.push(`${uploaded} uploadé${uploaded > 1 ? 's' : ''}`)}
    if (errors > 0) {parts.push(`${errors} erreur${errors > 1 ? 's' : ''}`)}
    if (parts.length === 0) {parts.push('Tout uploadé ✓')}
  }

  return (
    <View style={[styles.bar, errors > 0 && !running && styles.barError]}>
      {running && <ActivityIndicator color={theme.primary} size="small" />}
      <Text style={styles.text}>{parts.join(' | ')}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.surfaceAlt,
    borderRadius: 8,
  },
  barError: {
    borderWidth: 1,
    borderColor: theme.danger,
  },
  text: {
    color: theme.textSecondary,
    fontSize: 12,
    flexShrink: 1,
  },
})
