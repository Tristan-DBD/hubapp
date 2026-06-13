import { describe, it, expect } from 'vitest'
import {
  createEmptyStore, addCategory, deleteCategory,
  addList, deleteList,
  addItem, toggleItemCheck, deleteItem, updateItemStatus,
} from '../domain/store'

describe('Task Module', () => {
  it('creates an empty store', () => {
    const store = createEmptyStore()
    expect(store.categories).toEqual([])
  })

  it('adds a category', () => {
    const store = addCategory(createEmptyStore(), 'Courses')
    expect(store.categories).toHaveLength(1)
    expect(store.categories[0].name).toBe('Courses')
    expect(store.categories[0].lists).toEqual([])
  })

  it('deletes a category', () => {
    const s1 = addCategory(createEmptyStore(), 'Courses')
    const s2 = addCategory(s1, 'Work')
    const s3 = deleteCategory(s2, s1.categories[0].id)
    expect(s3.categories).toHaveLength(1)
    expect(s3.categories[0].name).toBe('Work')
  })

  it('adds a list to a category', () => {
    const s1 = addCategory(createEmptyStore(), 'Courses')
    const s2 = addList(s1, s1.categories[0].id, 'Supermarket', 'checklist')
    expect(s2.categories[0].lists).toHaveLength(1)
    expect(s2.categories[0].lists[0].name).toBe('Supermarket')
    expect(s2.categories[0].lists[0].type).toBe('checklist')
  })

  it('deletes a list', () => {
    const s1 = addCategory(createEmptyStore(), 'Courses')
    const catId = s1.categories[0].id
    const s2 = addList(s1, catId, 'Supermarket', 'checklist')
    const s3 = addList(s2, catId, 'Drugstore', 'simple')
    const s4 = deleteList(s3, catId, s3.categories[0].lists[0].id)
    expect(s4.categories[0].lists).toHaveLength(1)
    expect(s4.categories[0].lists[0].name).toBe('Drugstore')
  })

  it('adds a simple item', () => {
    const s1 = addCategory(createEmptyStore(), 'Ideas')
    const catId = s1.categories[0].id
    const s2 = addList(s1, catId, 'Random', 'simple')
    const listId = s2.categories[0].lists[0].id
    const s3 = addItem(s2, catId, listId, 'Great idea')
    expect(s3.categories[0].lists[0].items).toHaveLength(1)
    expect(s3.categories[0].lists[0].items[0].title).toBe('Great idea')
  })

  it('adds a todo item with priority and status', () => {
    const s1 = addCategory(createEmptyStore(), 'Projets')
    const catId = s1.categories[0].id
    const s2 = addList(s1, catId, 'HubApp', 'todo')
    const listId = s2.categories[0].lists[0].id
    const s3 = addItem(s2, catId, listId, 'Nouveau module', {
      description: 'Ajouter smart liste',
      priority: 'high',
      status: 'in_progress',
    })
    const item = s3.categories[0].lists[0].items[0]
    expect(item.title).toBe('Nouveau module')
    expect(item.description).toBe('Ajouter smart liste')
    expect(item.priority).toBe('high')
    expect(item.status).toBe('in_progress')
  })

  it('toggles checklist item', () => {
    const s1 = addCategory(createEmptyStore(), 'Courses')
    const catId = s1.categories[0].id
    const s2 = addList(s1, catId, 'Market', 'checklist')
    const listId = s2.categories[0].lists[0].id
    const s3 = addItem(s2, catId, listId, 'Lait')
    const itemId = s3.categories[0].lists[0].items[0].id
    expect(s3.categories[0].lists[0].items[0].checked).toBe(false)
    const s4 = toggleItemCheck(s3, catId, listId, itemId)
    expect(s4.categories[0].lists[0].items[0].checked).toBe(true)
    const s5 = toggleItemCheck(s4, catId, listId, itemId)
    expect(s5.categories[0].lists[0].items[0].checked).toBe(false)
  })

  it('deletes an item', () => {
    const s1 = addCategory(createEmptyStore(), 'Courses')
    const catId = s1.categories[0].id
    const s2 = addList(s1, catId, 'Market', 'checklist')
    const listId = s2.categories[0].lists[0].id
    const s3 = addItem(s2, catId, listId, 'Pain')
    const s4 = addItem(s3, catId, listId, 'Lait')
    const itemId = s4.categories[0].lists[0].items[0].id
    const s5 = deleteItem(s4, catId, listId, itemId)
    expect(s5.categories[0].lists[0].items).toHaveLength(1)
    expect(s5.categories[0].lists[0].items[0].title).toBe('Lait')
  })

  it('updates todo item status', () => {
    const s1 = addCategory(createEmptyStore(), 'Projets')
    const catId = s1.categories[0].id
    const s2 = addList(s1, catId, 'Todo', 'todo')
    const listId = s2.categories[0].lists[0].id
    const s3 = addItem(s2, catId, listId, 'Tâche')
    const itemId = s3.categories[0].lists[0].items[0].id
    const s4 = updateItemStatus(s3, catId, listId, itemId, 'done')
    expect(s4.categories[0].lists[0].items[0].status).toBe('done')
  })

  it('preserves other categories when modifying one', () => {
    const s1 = addCategory(createEmptyStore(), 'Courses')
    const s2 = addCategory(s1, 'Work')
    const cat1Id = s2.categories[0].id
    const s3 = addList(s2, cat1Id, 'Market', 'checklist')
    expect(s3.categories).toHaveLength(2)
    expect(s3.categories[1].name).toBe('Work')
    expect(s3.categories[1].lists).toEqual([])
  })
})
