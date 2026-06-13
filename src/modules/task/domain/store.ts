import type { TaskStoreData, CategoryData, ListData, ItemData, ListType, Priority, TodoStatus } from './types'

let idCounter = 0

function genId(): string {
  idCounter += 1
  return `${Date.now()}_${idCounter}`
}

export function createEmptyStore(): TaskStoreData {
  return { categories: [] }
}

export function addCategory(data: TaskStoreData, name: string): TaskStoreData {
  const category: CategoryData = {
    id: genId(),
    name,
    lists: [],
  }
  return { ...data, categories: [...data.categories, category] }
}

export function deleteCategory(data: TaskStoreData, categoryId: string): TaskStoreData {
  return {
    ...data,
    categories: data.categories.filter((c) => c.id !== categoryId),
  }
}

export function renameCategory(data: TaskStoreData, categoryId: string, name: string): TaskStoreData {
  return {
    ...data,
    categories: data.categories.map((c) =>
      c.id === categoryId ? { ...c, name } : c,
    ),
  }
}

export function addList(data: TaskStoreData, categoryId: string, name: string, type: ListType): TaskStoreData {
  const list: ListData = {
    id: genId(),
    name,
    type,
    items: [],
  }
  return {
    ...data,
    categories: data.categories.map((c) =>
      c.id === categoryId ? { ...c, lists: [...c.lists, list] } : c,
    ),
  }
}

export function deleteList(data: TaskStoreData, categoryId: string, listId: string): TaskStoreData {
  return {
    ...data,
    categories: data.categories.map((c) =>
      c.id === categoryId
        ? { ...c, lists: c.lists.filter((l) => l.id !== listId) }
        : c,
    ),
  }
}

export function addItem(
  data: TaskStoreData,
  categoryId: string,
  listId: string,
  title: string,
  extras?: { description?: string; priority?: Priority; status?: TodoStatus },
): TaskStoreData {
  const item: ItemData = {
    id: genId(),
    title,
    description: extras?.description,
    priority: extras?.priority,
    status: extras?.status,
    checked: false,
    createdAt: Date.now(),
    order: Date.now(),
  }
  return {
    ...data,
    categories: data.categories.map((c) =>
      c.id === categoryId
        ? {
            ...c,
            lists: c.lists.map((l) =>
              l.id === listId ? { ...l, items: [...l.items, item] } : l,
            ),
          }
        : c,
    ),
  }
}

export function toggleItemCheck(data: TaskStoreData, categoryId: string, listId: string, itemId: string): TaskStoreData {
  return {
    ...data,
    categories: data.categories.map((c) =>
      c.id === categoryId
        ? {
            ...c,
            lists: c.lists.map((l) =>
              l.id === listId
                ? {
                    ...l,
                    items: l.items.map((item) =>
                      item.id === itemId ? { ...item, checked: !item.checked } : item,
                    ),
                  }
                : l,
            ),
          }
        : c,
    ),
  }
}

export function deleteItem(data: TaskStoreData, categoryId: string, listId: string, itemId: string): TaskStoreData {
  return {
    ...data,
    categories: data.categories.map((c) =>
      c.id === categoryId
        ? {
            ...c,
            lists: c.lists.map((l) =>
              l.id === listId
                ? { ...l, items: l.items.filter((item) => item.id !== itemId) }
                : l,
            ),
          }
        : c,
    ),
  }
}

export function renameItem(
  data: TaskStoreData,
  categoryId: string,
  listId: string,
  itemId: string,
  title: string,
): TaskStoreData {
  return {
    ...data,
    categories: data.categories.map((c) =>
      c.id === categoryId
        ? {
            ...c,
            lists: c.lists.map((l) =>
              l.id === listId
                ? {
                    ...l,
                    items: l.items.map((item) =>
                      item.id === itemId ? { ...item, title } : item,
                    ),
                  }
                : l,
            ),
          }
        : c,
    ),
  }
}

export function updateItemStatus(
  data: TaskStoreData,
  categoryId: string,
  listId: string,
  itemId: string,
  status: TodoStatus,
): TaskStoreData {
  return {
    ...data,
    categories: data.categories.map((c) =>
      c.id === categoryId
        ? {
            ...c,
            lists: c.lists.map((l) =>
              l.id === listId
                ? {
                    ...l,
                    items: l.items.map((item) =>
                      item.id === itemId ? { ...item, status } : item,
                    ),
                  }
                : l,
            ),
          }
        : c,
    ),
  }
}

export function getCategory(data: TaskStoreData, categoryId: string): CategoryData | undefined {
  return data.categories.find((c) => c.id === categoryId)
}

export function getList(data: TaskStoreData, categoryId: string, listId: string): ListData | undefined {
  const cat = getCategory(data, categoryId)
  return cat?.lists.find((l) => l.id === listId)
}

export function getItem(data: TaskStoreData, categoryId: string, listId: string, itemId: string): ItemData | undefined {
  const list = getList(data, categoryId, listId)
  return list?.items.find((item) => item.id === itemId)
}
