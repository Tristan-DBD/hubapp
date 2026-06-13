import { vi } from 'vitest'

vi.mock('react-native', () => ({
  NativeModules: {
    StoragePermission: {
      isExternalStorageManager: vi.fn().mockResolvedValue(true),
      openManageStorageSettings: vi.fn(),
    },
  },
  Platform: { OS: 'android' },
  AppState: { addEventListener: vi.fn(() => ({ remove: vi.fn() })) },
}))

const mockStorage = new Map<string, string>()

vi.mock('react-native-mmkv', () => ({
  MMKV: vi.fn(function () {
    return {
      set: vi.fn((key: string, value: string) => {
        mockStorage.set(key, value)
      }),
      getString: vi.fn((key: string) => mockStorage.get(key) ?? undefined),
      delete: vi.fn((key: string) => {
        mockStorage.delete(key)
      }),
      clearAll: vi.fn(() => {
        mockStorage.clear()
      }),
    }
  }),
}))
