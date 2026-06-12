import { NativeModules, Platform } from 'react-native'
import { MMKV } from 'react-native-mmkv'

export const EXTERNAL_PATH = '/sdcard/HubApp/mmkv/'

let _storage: MMKV | null = null
let _initPromise: Promise<void> | null = null

export async function ensureExternalStorage(): Promise<void> {
  if (_storage) {return}

  if (_initPromise) {
    try { await _initPromise; return }
    catch { /* previous attempt failed — retry */ }
  }

  _initPromise = (async () => {
    try {
      if (Platform.OS !== 'android') {return}

      const perm = NativeModules.StoragePermission
      if (!perm) {return}

      const granted = await perm.isExternalStorageManager()
      if (!granted) {throw new Error('STORAGE_PERMISSION_REQUIRED')}

      _storage = new MMKV({ id: 'hubapp-data', path: EXTERNAL_PATH })
    } finally {
      _initPromise = null
    }
  })()

  return _initPromise
}

function getStorage(): MMKV {
  if (!_storage) {
    _storage = new MMKV({ id: 'hubapp-data', path: EXTERNAL_PATH })
  }
  return _storage
}

export function mmkvGet(key: string): any {
  const value = getStorage().getString(key)
  if (value === undefined || value === null) {return null}
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

export function mmkvSet(key: string, value: any): void {
  getStorage().set(key, JSON.stringify(value))
}

export function mmkvDelete(key: string): void {
  getStorage().delete(key)
}

export function mmkvClearAll(): void {
  getStorage().clearAll()
}
