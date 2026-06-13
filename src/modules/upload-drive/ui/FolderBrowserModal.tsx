import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { authService } from '../../../core/google'
import { driveService } from '../../../core/google/drive-service'
import { theme } from '../../../core/theme'
import type { DriveFolder } from '../../../core/types'
import { styles } from './FolderBrowserModal.styles'

interface FolderBrowserModalProps {
  onCancel: () => void;
  onSelect: (folder: DriveFolder) => void;
}

export function FolderBrowserModal({ onSelect, onCancel }: FolderBrowserModalProps) {
  const [loading, setLoading] = useState(true)
  const [authenticating, setAuthenticating] = useState(false)
  const [switchingAccount, setSwitchingAccount] = useState(false)
  const [folders, setFolders] = useState<DriveFolder[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined)
  const [currentFolderName, setCurrentFolderName] = useState('Drive')
  const [history, setHistory] = useState<{ id: string; name: string }[]>([])
  const [newFolderName, setNewFolderName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const init = async () => {
    setLoading(true)
    try {
      if (!authService.isSignedIn()) {
        setAuthenticating(true)
        const restored = await authService.restoreToken()
        if (!restored) {
          await authService.signIn()
        }
        setAuthenticating(false)
      }
      await loadFolders(undefined)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      Alert.alert('Erreur', message || 'Impossible de se connecter à Drive')
      onCancel()
    } finally {
      setLoading(false)
    }
  }

  const loadFolders = async (parentId: string | undefined) => {
    try {
      if (parentId === undefined) {
        const filtered = await driveService.listFolders('root')
        if (filtered.length > 0) {
          setFolders(filtered)
        } else {
          const all = await driveService.listFolders(undefined)
          setFolders(all)
        }
      } else {
        const list = await driveService.listFolders(parentId)
        setFolders(list)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      Alert.alert('Erreur', message || 'Impossible de charger les dossiers')
    }
  }

  const handleSwitchAccount = async () => {
    setSwitchingAccount(true)
    try {
      await authService.signOut()
      await authService.signIn()
      setCurrentFolderId(undefined)
      setCurrentFolderName('Drive')
      setHistory([])
      await loadFolders(undefined)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      Alert.alert('Erreur', msg || 'Impossible de changer de compte')
    } finally {
      setSwitchingAccount(false)
    }
  }

  const navigateToFolder = async (folder: DriveFolder) => {
    setHistory((prev) => [...prev, { id: currentFolderId || 'root', name: currentFolderName }])
    setCurrentFolderId(folder.id)
    setCurrentFolderName(folder.name)
    setNewFolderName('')
    await loadFolders(folder.id)
  }

  const goBack = async () => {
    if (history.length === 0) {return}
    const prev = history[history.length - 1]
    setHistory((prevHistory) => prevHistory.slice(0, -1))
    const parentId = prev.id === 'root' ? undefined : prev.id
    setCurrentFolderId(parentId)
    setCurrentFolderName(prev.name)
    await loadFolders(parentId)
  }

  const handleCreateFolder = async () => {
    const name = newFolderName.trim()
    if (!name) {return}
    setCreating(true)
    try {
      const id = await driveService.findOrCreateFolder(name, currentFolderId || 'root')
      const newFolder: DriveFolder = { id, name }
      setFolders((prev) => [...prev, newFolder])
      setNewFolderName('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      Alert.alert('Erreur', message || 'Impossible de créer le dossier')
    } finally {
      setCreating(false)
    }
  }

  const handleConfirm = () => {
    const folder: DriveFolder = {
      id: currentFolderId || 'root',
      name: currentFolderName,
    }
    onSelect(folder)
  }

  if (loading || authenticating) {
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.popup}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={theme.primary} size="large" />
              <Text style={styles.loadingText}>
                {authenticating ? 'Connexion à Google...' : 'Chargement...'}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    )
  }

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <View style={styles.header}>
            {history.length > 0 && (
              <TouchableOpacity onPress={goBack} style={styles.backBtn}>
                <Text style={styles.backBtnText}>← Retour</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.title} numberOfLines={1}>{currentFolderName}</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.switchAccountBtn}
            onPress={handleSwitchAccount}
            disabled={switchingAccount}
          >
            {switchingAccount ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Text style={styles.switchAccountText}>🔄 Changer de compte</Text>
            )}
          </TouchableOpacity>

          <FlatList
            data={folders}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.folderRow}
                onPress={() => navigateToFolder(item)}
              >
                <Text style={styles.folderIcon}>📂</Text>
                <Text style={styles.folderName}>{item.name}</Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Dossier vide</Text>
            }
          />

          <View style={styles.createRow}>
            <TextInput
              style={styles.createInput}
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="Nouveau dossier"
              placeholderTextColor={theme.textMuted}
              returnKeyType="done"
              onSubmitEditing={handleCreateFolder}
              blurOnSubmit
            />
            <TouchableOpacity
              style={[styles.createBtn, (!newFolderName.trim() || creating) && styles.disabled]}
              onPress={handleCreateFolder}
              disabled={!newFolderName.trim() || creating}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.createBtnText}>+</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmBtnText}>
              Uploader ici
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}
