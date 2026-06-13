import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { authService } from '../../../core/google/auth-service'
import { driveService } from '../../../core/google/drive-service'
import { theme } from '../../../core/theme'
import type { DriveFolder } from '../../../core/types'
import type { DriveDestination } from '../domain/types'
import { styles } from './DriveFolderBrowser.styles'

interface FolderLevel {
  folders: DriveFolder[];
  label: string;
  parentId: string;
  selected: DriveFolder | null;
}

interface DriveFolderBrowserProps {
  onCancel: () => void;
  onSave: (dest: DriveDestination) => void;
}

export function DriveFolderBrowser({ onSave, onCancel }: DriveFolderBrowserProps) {
  const [authenticating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [switchingAccount, setSwitchingAccount] = useState(false)
  const [levels, setLevels] = useState<FolderLevel[]>([
    { label: 'Vidéo coaching', folders: [], selected: null, parentId: 'root' },
    { label: 'Bloc', folders: [], selected: null, parentId: '' },
    { label: 'Semaine', folders: [], selected: null, parentId: '' },
    { label: 'Séance', folders: [], selected: null, parentId: '' },
  ])
  const [currentLevel, setCurrentLevel] = useState(0)
  const [newFolderName, setNewFolderName] = useState('')
  const [creating, setCreating] = useState(false)

  const folderSuggestions = (() => {
    if (currentLevel === 0) {return []}
    const prefixes = ['', 'Bloc ', 'Semaine ', 'Séance ']
    return [1, 2, 3, 4].map((n) => `${prefixes[currentLevel]}${n}`)
  })()

  useEffect(() => { init() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const init = async () => {
    setLoading(true)
    try {
      if (!authService.isSignedIn()) {
        const restored = await authService.restoreToken()
        if (!restored) {await authService.signIn()}
      }
      await loadFoldersForLevel(0, 'root')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      Alert.alert('Erreur', message || 'Impossible de se connecter à Drive')
      onCancel()
    } finally {
      setLoading(false)
    }
  }

  const loadFoldersForLevel = async (levelIndex: number, parentId: string) => {
    try {
      const folders = await driveService.listFolders(parentId)
      setLevels((prev) => {
        const copy = [...prev]
        copy[levelIndex] = { ...copy[levelIndex], folders, selected: null, parentId }
        for (let i = levelIndex + 1; i < copy.length; i++) {
          copy[i] = { ...copy[i], folders: [], selected: null, parentId: '' }
        }
        return copy
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      Alert.alert('Erreur', message || 'Impossible de charger les dossiers')
    }
  }

  const handleSelectFolder = useCallback(
    async (folder: DriveFolder) => {
      setLevels((prev) => {
        const copy = [...prev]
        copy[currentLevel] = { ...copy[currentLevel], selected: folder }
        return copy
      })
      if (currentLevel < 3) {
        const nextLevel = currentLevel + 1
        setCurrentLevel(nextLevel)
        await loadFoldersForLevel(nextLevel, folder.id)
      }
    },
    [currentLevel],
  )

  const handleCreateFolder = useCallback(async () => {
    const name = newFolderName.trim()
    if (!name) {return}
    setCreating(true)
    try {
      const parentId = levels[currentLevel].parentId
      const id = await driveService.findOrCreateFolder(name, parentId)
      setLevels((prev) => {
        const copy = [...prev]
        copy[currentLevel] = {
          ...copy[currentLevel],
          folders: [...copy[currentLevel].folders, { id, name }],
        }
        return copy
      })
      setNewFolderName('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      Alert.alert('Erreur', message || 'Impossible de créer le dossier')
    } finally {
      setCreating(false)
    }
  }, [newFolderName, currentLevel, levels])

  const handleConfirm = useCallback(() => {
    const selected = levels.map((l) => l.selected)
    if (selected.some((s) => !s)) {return}

    const blockFolder = selected[1]
    const weekFolder = selected[2]
    const sessionFolder = selected[3]
    if (!blockFolder || !weekFolder || !sessionFolder) {return}

    const blockMatch = blockFolder.name.match(/\d+/)
    const weekMatch = weekFolder.name.match(/\d+/)
    const sessionMatch = sessionFolder.name.match(/\d+/)
    onSave({
      currentBlock: blockMatch ? parseInt(blockMatch[0], 10) : 0,
      currentWeek: weekMatch ? parseInt(weekMatch[0], 10) : 0,
      currentSession: sessionMatch ? parseInt(sessionMatch[0], 10) : 0,
      blockFolderId: blockFolder.id,
      weekFolderId: weekFolder.id,
      sessionFolderId: sessionFolder.id,
    })
  }, [levels, onSave])

  const goBack = useCallback(() => {
    setCurrentLevel((prev) => Math.max(0, prev - 1))
  }, [])

  const canConfirm = currentLevel === 3 && levels[3].selected !== null
  const current = levels[currentLevel]

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.popup}>
          {authenticating || loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={theme.primary} size="large" />
              <Text style={styles.loadingText}>
                {authenticating ? 'Connexion à Google...' : 'Chargement...'}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                {currentLevel > 0 && (
                  <TouchableOpacity onPress={goBack} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>← Retour</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.title}>
                  {current.label === 'Coaching' ? 'Coaching' : `Choisir ${current.label}`}
                </Text>
                <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.switchAccountBtn}
                onPress={async () => {
                  setSwitchingAccount(true)
                  try {
                    await authService.signOut()
                    await authService.signIn()
                    await loadFoldersForLevel(0, 'root')
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : String(err)
                    Alert.alert('Erreur', msg || 'Impossible de changer de compte')
                  } finally {
                    setSwitchingAccount(false)
                  }
                }}
                disabled={switchingAccount}
              >
                {switchingAccount ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Text style={styles.switchAccountText}>🔄 Changer de compte</Text>
                )}
              </TouchableOpacity>

              {levels.slice(0, currentLevel + 1).map((l, i) =>
                l.selected ? (
                  <Text key={i} style={styles.breadcrumb}>
                    {l.selected.name} {i < currentLevel ? '›' : ''}
                  </Text>
                ) : null,
              )}

              <FlatList
                data={current.folders}
                keyExtractor={(item) => item.id}
                style={styles.list}
                renderItem={({ item }) => {
                  const isSelected = current.selected?.id === item.id
                  return (
                    <TouchableOpacity
                      style={[styles.folderRow, isSelected && styles.folderRowSelected]}
                      onPress={() => handleSelectFolder(item)}
                    >
                      <Text style={styles.folderIcon}>{currentLevel === 3 ? '📁' : '📂'}</Text>
                      <Text style={[styles.folderName, isSelected && styles.folderNameSelected]}>
                        {item.name}
                      </Text>
                      {currentLevel < 3 && <Text style={styles.chevron}>›</Text>}
                    </TouchableOpacity>
                  )
                }}
                ListEmptyComponent={<Text style={styles.emptyText}>Aucun dossier</Text>}
              />

              {currentLevel > 0 && (
                <View style={styles.suggestionRow}>
                  {folderSuggestions.map((name) => (
                    <TouchableOpacity
                      key={name}
                      style={styles.suggestionChip}
                      onPress={() => setNewFolderName(name)}
                    >
                      <Text style={styles.suggestionChipText}>{name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={styles.createRow}>
                <TextInput
                  style={styles.createInput}
                  value={newFolderName}
                  onChangeText={setNewFolderName}
                  placeholder={`Nouveau ${current.label}`}
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
                style={[styles.confirmBtn, !canConfirm && styles.disabled]}
                onPress={handleConfirm}
                disabled={!canConfirm}
              >
                <Text style={styles.confirmBtnText}>Confirmer la destination</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  )
}
