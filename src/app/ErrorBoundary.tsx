import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { dumpBreadcrumbs } from '../core/logger'
import { theme } from '../core/theme'

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    console.error(dumpBreadcrumbs('ErrorBoundary'))
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Application Error</Text>
          <ScrollView style={styles.scroll}>
            <Text style={styles.message}>{this.state.error?.message}</Text>
            <Text style={styles.stack}>{this.state.error?.stack}</Text>
          </ScrollView>
        </View>
      )
    }
    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: theme.bg },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.danger, marginBottom: 16 },
  scroll: { flex: 1, width: '100%' },
  message: { fontSize: 16, color: theme.text, marginBottom: 12 },
  stack: { fontSize: 12, color: theme.textSecondary, fontFamily: 'monospace' },
})
