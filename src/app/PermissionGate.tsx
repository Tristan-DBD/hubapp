import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, AppState, ActivityIndicator } from 'react-native'
import { NativeModules } from 'react-native'
import { ensureExternalStorage } from '../core/db/storage/mmkv'
import { theme } from '../core/theme'

interface Props {
  children: React.ReactNode;
}

type State = 'loading' | 'granted' | 'denied' | 'checking';

export function PermissionGate({ children }: Props) {
  const [state, setState] = useState<State>('loading')

  const check = useCallback(async () => {
    setState('checking')
    try {
      await ensureExternalStorage()
      setState('granted')
    } catch {
      setState('denied')
    }
  }, [])

  useEffect(() => {
    check()
  }, [check])

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active' && state === 'denied') {
        check()
      }
    })
    return () => sub.remove()
  }, [state, check])

  if (state === 'granted') {return <>{children}</>}

  if (state === 'loading' || state === 'checking') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>HubApp</Text>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Accès au stockage requis</Text>
      <Text style={styles.message}>
        HubApp a besoin d'accéder à tous vos fichiers pour stocker vos données en
        dehors du sandbox de l'application.
      </Text>
      <Text style={styles.instruction}>
        1. Appuyez sur "Ouvrir les paramètres"{'\n'}
        2. Activez "Autoriser l'accès à tous les fichiers"{'\n'}
        3. Revenez sur l'application puis appuyez sur "Vérifier"
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => NativeModules.StoragePermission?.openManageStorageSettings()}
      >
        <Text style={styles.buttonText}>Ouvrir les paramètres</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.retryButton]}
        onPress={check}
      >
        <Text style={styles.buttonText}>Vérifier à nouveau</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: theme.bg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  instruction: {
    fontSize: 15,
    color: theme.primary,
    textAlign: 'left',
    lineHeight: 24,
    marginBottom: 32,
    alignSelf: 'stretch',
    paddingHorizontal: 16,
  },
  button: {
    backgroundColor: theme.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  retryButton: {
    backgroundColor: theme.border,
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
