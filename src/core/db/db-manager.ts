import { createDB } from './db-wrapper'
import type { DB, DBManager } from './types'

const instanceCache = new Map<string, DB>()

export const dbManager: DBManager = {
  getDB(moduleId: string): DB {
    if (!instanceCache.has(moduleId)) {
      instanceCache.set(moduleId, createDB(moduleId))
    }
    return instanceCache.get(moduleId)!
  },

  registerModule(moduleId: string): void {
    if (!instanceCache.has(moduleId)) {
      instanceCache.set(moduleId, createDB(moduleId))
    }
  },

  unregisterModule(moduleId: string): void {
    instanceCache.delete(moduleId)
  },

  clearAll(): void {
    instanceCache.clear()
  },
}
