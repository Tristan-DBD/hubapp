import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { BackHandler, View, LayoutAnimation } from 'react-native'
import { dbManager } from '../../../core/db/db-manager'
import {
  createEmptyStore, addCategory, deleteCategory,
  addList, deleteList,
  addItem, renameItem, toggleItemCheck, deleteItem, updateItemStatus,
} from '../domain/store'
import type { TaskStoreData, ListType, Priority, TodoStatus } from '../domain/types'
import { CategoryView } from './CategoryView'
import { DashboardView } from './DashboardView'
import { ListView } from './ListView'
import { styles } from './TaskScreen.styles'

type Screen =
  | { name: 'dashboard' }
  | { categoryId: string; name: 'category' }
  | { categoryId: string; listId: string; name: 'list' }

export function TaskScreen() {
  const db = useMemo(() => dbManager.getDB('task'), [])
  const [screen, setScreen] = useState<Screen>({ name: 'dashboard' })
  const [data, setData] = useState<TaskStoreData>(() => db.get('data') || createEmptyStore())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    dbManager.registerModule('task')
  }, [])

  useEffect(() => {
    const onBack = () => {
      if (screen.name === 'list') {
        setScreen({ categoryId: screen.categoryId, name: 'category' })
        return true
      }
      if (screen.name === 'category') {
        setScreen({ name: 'dashboard' })
        return true
      }
      return false
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack)
    return () => sub.remove()
  }, [screen])

  const persist = useCallback((newData: TaskStoreData) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setData(newData)
    db.set('data', newData)
  }, [db])

  const handleAddCategory = useCallback((name: string) => {
    persist(addCategory(data, name))
  }, [data, persist])

  const handleDeleteCategory = useCallback((categoryId: string) => {
    persist(deleteCategory(data, categoryId))
  }, [data, persist])

  const handleAddList = useCallback((name: string, type: ListType) => {
    if (screen.name !== 'category') { return }
    persist(addList(data, screen.categoryId, name, type))
  }, [data, persist, screen])

  const handleDeleteList = useCallback((listId: string) => {
    if (screen.name !== 'category') { return }
    persist(deleteList(data, screen.categoryId, listId))
  }, [data, persist, screen])

  const handleAddItem = useCallback((
    title: string,
    extras?: { description?: string; priority?: Priority; status?: TodoStatus },
  ) => {
    if (screen.name !== 'list') { return }
    persist(addItem(data, screen.categoryId, screen.listId, title, extras))
  }, [data, persist, screen])

  const handleToggleCheck = useCallback((itemId: string) => {
    if (screen.name !== 'list') { return }
    persist(toggleItemCheck(data, screen.categoryId, screen.listId, itemId))
  }, [data, persist, screen])

  const handleRenameItem = useCallback((itemId: string, title: string) => {
    if (screen.name !== 'list') { return }
    persist(renameItem(data, screen.categoryId, screen.listId, itemId, title))
  }, [data, persist, screen])

  const handleDeleteItem = useCallback((itemId: string) => {
    if (screen.name !== 'list') { return }
    persist(deleteItem(data, screen.categoryId, screen.listId, itemId))
  }, [data, persist, screen])

  const handleUpdateStatus = useCallback((itemId: string, status: TodoStatus) => {
    if (screen.name !== 'list') { return }
    persist(updateItemStatus(data, screen.categoryId, screen.listId, itemId, status))
  }, [data, persist, screen])

  const handleSelectCategory = useCallback((categoryId: string) => {
    setScreen({ categoryId, name: 'category' })
  }, [])

  const handleSelectList = useCallback((listId: string) => {
    if (screen.name !== 'category') { return }
    setScreen({ categoryId: screen.categoryId, listId, name: 'list' })
  }, [screen])

  const handleBack = useCallback(() => {
    if (screen.name === 'category') { setScreen({ name: 'dashboard' }) }
    else if (screen.name === 'list') {
      setScreen({ categoryId: screen.categoryId, name: 'category' })
    }
  }, [screen])

  return (
    <View style={styles.container}>
      {screen.name === 'dashboard' && (
        <DashboardView
          data={data}
          viewMode={viewMode}
          onToggleView={() => setViewMode((v) => v === 'grid' ? 'list' : 'grid')}
          onSelectCategory={handleSelectCategory}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      )}
      {screen.name === 'category' && (
        <CategoryView
          data={data}
          categoryId={screen.categoryId}
          onBack={handleBack}
          onSelectList={handleSelectList}
          onAddList={handleAddList}
          onDeleteList={handleDeleteList}
        />
      )}
      {screen.name === 'list' && (
        <ListView
          data={data}
          categoryId={screen.categoryId}
          listId={screen.listId}
          onBack={handleBack}
          onAddItem={handleAddItem}
          onRenameItem={handleRenameItem}
          onToggleCheck={handleToggleCheck}
          onDeleteItem={handleDeleteItem}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </View>
  )
}
