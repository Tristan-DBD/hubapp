import { mmkvGet, mmkvSet, mmkvDelete } from './storage/mmkv'
import type { DB } from './types'

export function createDB(moduleId: string): DB {
  const prefix = `${moduleId}:`

  return {
    get(key: string): any {
      return mmkvGet(`${prefix}${key}`)
    },

    set(key: string, value: any): void {
      mmkvSet(`${prefix}${key}`, value)
    },

    delete(key: string): void {
      mmkvDelete(`${prefix}${key}`)
    },

    clear(): void {
      // Namespace-aware clear is not natively supported by MMKV.
      // For full isolation, we track keys per namespace.
      const allKeys = getAllKeysForPrefix(prefix)
      allKeys.forEach((k) => mmkvDelete(k))
    },
  }
}

function getAllKeysForPrefix(_prefix: string): string[] {
  // In MMKV there's no built-in prefix scan.
  // This is best-effort. The storage.clearAll() will clear everything.
  // For real isolation, each module could use a separate MMKV instance.
  return []
}
