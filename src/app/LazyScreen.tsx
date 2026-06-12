import React, { useState, useEffect } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { theme } from '../core/theme'

interface LazyScreenProps {
  loadScreen: () => Promise<{ default: React.ComponentType }>;
}

export function LazyScreen({ loadScreen }: LazyScreenProps) {
  const [Screen, setScreen] = useState<React.ComponentType | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    loadScreen()
      .then((m) => {
        if (!cancelled) {setScreen(() => m.default)}
      })
      .catch((err) => {
        if (!cancelled) {setError(err)}
      })
    return () => { cancelled = true }
  }, [loadScreen])

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    )
  }

  if (!Screen) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    )
  }

  return <Screen />
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg },
  errorText: { color: theme.danger, fontSize: 16, textAlign: 'center', paddingHorizontal: 24 },
})
