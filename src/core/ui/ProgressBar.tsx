import React from 'react'
import { View, StyleSheet } from 'react-native'
import { theme } from '../theme'

interface ProgressBarProps {
  color: string;
  progress: number;
}

export function ProgressBar({ progress, color }: ProgressBarProps) {
  const pct = Math.min(Math.max(progress, 0), 1)
  return (
    <View style={styles.progressBg}>
      <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  progressBg: {
    height: 4,
    backgroundColor: theme.surfaceAlt,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
})
