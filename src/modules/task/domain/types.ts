export type ListType = 'checklist' | 'simple' | 'todo'
export type Priority = 'low' | 'normal' | 'high'
export type TodoStatus = 'pending' | 'in_progress' | 'done'

export interface ItemData {
  checked?: boolean
  createdAt: number
  description?: string
  id: string
  order: number
  priority?: Priority
  status?: TodoStatus
  title: string
}

export interface ListData {
  id: string
  items: ItemData[]
  name: string
  type: ListType
}

export interface CategoryData {
  id: string
  lists: ListData[]
  name: string
}

export interface TaskStoreData {
  categories: CategoryData[]
}

export const PRIORITIES: Priority[] = ['high', 'normal', 'low']
export const STATUES: TodoStatus[] = ['pending', 'in_progress', 'done']

export const PRIORITY_ORDER: Record<Priority, number> = {
  high: 0,
  normal: 1,
  low: 2,
}

export const STATUS_ORDER: Record<TodoStatus, number> = {
  pending: 0,
  in_progress: 1,
  done: 2,
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'Haute',
  normal: 'Normale',
  low: 'Basse',
}

export const STATUS_LABELS: Record<TodoStatus, string> = {
  pending: 'À faire',
  in_progress: 'En cours',
  done: 'Fait',
}

export const LIST_TYPE_LABELS: Record<ListType, string> = {
  checklist: 'Checklist',
  simple: 'Liste',
  todo: 'Todo',
}
