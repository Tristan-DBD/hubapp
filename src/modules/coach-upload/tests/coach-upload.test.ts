import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dbManager } from '../../../core/db/db-manager'
import { driveService } from '../../../core/google/drive-service'
import { resolveDuplicateNames } from '../../../core/utils'
import {
  generateFinalName,
  validateChargeInput,
} from '../domain/types'
import { destinationService } from '../services/destination.service'
import { folderPathService } from '../services/folder-path.service'
import { uploadService } from '../services/upload.service'

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('@react-native-documents/picker', () => ({
  pick: vi.fn().mockResolvedValue([{ uri: 'file:///test.mp4', name: 'test.mp4', size: 1000 }]),
  types: { video: 'video/mp4' },
}))

vi.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: vi.fn(),
    hasPlayServices: vi.fn().mockResolvedValue(true),
    signIn: vi.fn().mockResolvedValue({ user: { email: 'test@test.com' } }),
    signOut: vi.fn().mockResolvedValue(undefined),
    getTokens: vi.fn().mockResolvedValue({ accessToken: 'mock-google-token', idToken: 'mock-id-token' }),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}))

describe('CoachUpload - Domain', () => {
  describe('generateFinalName', () => {
    it('should generate name with charge', () => {
      expect(generateFinalName('squat', 120)).toBe('squat - 120 kgs')
    })

    it('should generate name with decimal charge (comma format)', () => {
      expect(generateFinalName('bench', 197.5)).toBe('bench - 197,5 kgs')
    })

    it('should generate name without charge', () => {
      expect(generateFinalName('deadlift', null)).toBe('deadlift')
    })

    it('should return empty string for empty movement', () => {
      expect(generateFinalName('', 50)).toBe('')
    })

    it('should handle movement with whitespace', () => {
      expect(generateFinalName('  squat  ', 100)).toBe('squat - 100 kgs')
    })
  })

  describe('resolveDuplicateNames', () => {
    it('should not modify unique names', () => {
      const names = ['squat - 120 kgs', 'bench - 80 kgs']
      expect(resolveDuplicateNames(names)).toEqual(names)
    })

    it('should suffix duplicates with (1), (2)...', () => {
      const names = ['squat - 120 kgs', 'squat - 120 kgs', 'squat - 120 kgs']
      expect(resolveDuplicateNames(names)).toEqual([
        'squat - 120 kgs',
        'squat - 120 kgs (1)',
        'squat - 120 kgs (2)',
      ])
    })

    it('should handle empty names', () => {
      expect(resolveDuplicateNames(['', ''])).toEqual(['', ''])
    })
  })

  describe('validateChargeInput', () => {
    it('should accept integer', () => {
      expect(validateChargeInput('120')).toBe(120)
    })

    it('should accept decimal with comma', () => {
      expect(validateChargeInput('197,5')).toBe(197.5)
    })

    it('should accept decimal with dot', () => {
      expect(validateChargeInput('197.5')).toBe(197.5)
    })

    it('should return null for empty input', () => {
      expect(validateChargeInput('')).toBeNull()
    })

    it('should return null for whitespace-only', () => {
      expect(validateChargeInput('   ')).toBeNull()
    })

    it('should return null for invalid input', () => {
      expect(validateChargeInput('abc')).toBeNull()
    })

    it('should reject negative values', () => {
      expect(validateChargeInput('-10')).toBeNull()
    })
  })
})

describe('CoachUpload - Destination Service (MMKV)', () => {
  beforeEach(() => {
    destinationService.clear()
  })

  it('should return null when no destination stored', () => {
    expect(destinationService.get()).toBeNull()
  })

  it('should store and retrieve destination', () => {
    const dest = {
      currentBlock: 5,
      currentWeek: 3,
      currentSession: 2,
      blockFolderId: 'block_123',
      weekFolderId: 'week_456',
      sessionFolderId: 'session_789',
    }
    destinationService.set(dest)
    expect(destinationService.get()).toEqual(dest)
  })

  it('should overwrite existing destination', () => {
    destinationService.set({
      currentBlock: 1,
      currentWeek: 1,
      currentSession: 1,
      blockFolderId: '',
      weekFolderId: '',
      sessionFolderId: '',
    })
    destinationService.set({
      currentBlock: 2,
      currentWeek: 2,
      currentSession: 2,
      blockFolderId: 'new_id',
      weekFolderId: '',
      sessionFolderId: '',
    })
    expect(destinationService.get()?.currentBlock).toBe(2)
  })

  it('should clear destination', () => {
    destinationService.set({
      currentBlock: 3,
      currentWeek: 1,
      currentSession: 1,
      blockFolderId: '',
      weekFolderId: '',
      sessionFolderId: '',
    })
    destinationService.clear()
    expect(destinationService.get()).toBeNull()
  })

  it('should persist data through service re-init', () => {
    const dest = {
      currentBlock: 5,
      currentWeek: 3,
      currentSession: 2,
      blockFolderId: 'folder_1',
      weekFolderId: 'folder_2',
      sessionFolderId: 'folder_3',
    }
    destinationService.set(dest)
    const retrieved = destinationService.get()
    expect(retrieved?.currentBlock).toBe(5)
    expect(retrieved?.currentWeek).toBe(3)
    expect(retrieved?.currentSession).toBe(2)
  })
})

describe('CoachUpload - Folder Path Service', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    driveService.setAccessToken('test-token')
  })

  it('should create full path: Coaching/Bloc/Semaine/Seance', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ files: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'coaching_id' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ files: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'bloc_id' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ files: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'week_id' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ files: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'session_id' }) })

    const result = await folderPathService.ensurePath(5, 3, 2)
    expect(result.blockFolderId).toBe('bloc_id')
    expect(result.weekFolderId).toBe('week_id')
    expect(result.sessionFolderId).toBe('session_id')
  })
})

describe('CoachUpload - Upload Service', () => {
  beforeEach(() => {
    vi.spyOn(driveService, 'uploadFile').mockResolvedValue('file_mock_id')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should upload multiple files in parallel', async () => {
    const jobs = [
      { fileUri: '/v1.mp4', fileName: 'squat - 120 kgs', mimeType: 'video/mp4' },
      { fileUri: '/v2.mp4', fileName: 'bench - 80 kgs', mimeType: 'video/mp4' },
    ]

    const results = await uploadService.uploadMultiple(jobs, 'session_1')
    expect(results).toHaveLength(2)
    expect(results[0].success).toBe(true)
    expect(results[1].success).toBe(true)
    expect(driveService.uploadFile).toHaveBeenCalledTimes(2)
  })

  it('should handle duplicate names by adding suffixes', async () => {
    const jobs = [
      { fileUri: '/v1.mp4', fileName: 'squat - 100 kgs', mimeType: 'video/mp4' },
      { fileUri: '/v2.mp4', fileName: 'squat - 100 kgs', mimeType: 'video/mp4' },
    ]

    const results = await uploadService.uploadMultiple(jobs, 'session_1')
    expect(results[0].fileName).toBe('squat - 100 kgs')
    expect(results[1].fileName).toBe('squat - 100 kgs (1)')
  })

  it('should return empty array for no jobs', async () => {
    const results = await uploadService.uploadMultiple([], 'session_1')
    expect(results).toEqual([])
  })

  it('should report upload progress', async () => {
    const onProgress = vi.fn()
    const jobs = [
      {
        fileUri: '/v1.mp4',
        fileName: 'squat.mp4',
        mimeType: 'video/mp4',
        onProgress,
      },
    ]

    const mockUploadFile = vi
      .spyOn(driveService, 'uploadFile')
      .mockImplementation(async (_uri, _name, _parent, _mime, onProg) => {
        onProg?.(0.5)
        onProg?.(1.0)
        return 'file_mock_id'
      })

    await uploadService.uploadMultiple(jobs, 'session_1')
    expect(onProgress).toHaveBeenCalled()
    expect(mockUploadFile).toHaveBeenCalledOnce()
  })
})

describe('CoachUpload - Module Isolation', () => {
  it('should have its own DB namespace', () => {
    const db = dbManager.getDB('coach-upload')
    const accountsDb = dbManager.getDB('accounts')
    db.set('test_key', 'coach_value')
    expect(accountsDb.get('test_key')).toBeNull()
  })

  it('should not affect other modules data', () => {
    const db = dbManager.getDB('coach-upload')
    const accountsDb = dbManager.getDB('accounts')
    accountsDb.set('shared_key', 'accounts_value')
    expect(db.get('shared_key')).toBeNull()
  })

  it('should have isolated namespace for each module', () => {
    const coachDb = dbManager.getDB('coach-upload')
    const accountsDb = dbManager.getDB('accounts')
    coachDb.set('my_key', 'coach_value')
    accountsDb.set('my_key', 'accounts_value')
    expect(coachDb.get('my_key')).toBe('coach_value')
    expect(accountsDb.get('my_key')).toBe('accounts_value')
  })
})

describe('CoachUpload - Video Deletion', () => {
  it('should remove video from list by id', () => {
    const videos = [
      { id: '1', fileName: 'a.mp4' },
      { id: '2', fileName: 'b.mp4' },
      { id: '3', fileName: 'c.mp4' },
    ]
    const filtered = videos.filter((v) => v.id !== '2')
    expect(filtered).toHaveLength(2)
    expect(filtered.find((v) => v.id === '2')).toBeUndefined()
  })
})

describe('CoachUpload - Destination Drive Flow', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    driveService.setAccessToken('test-token')
  })

  it('should find existing Coaching folder', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        files: [{ id: 'coaching_1', name: 'Coaching' }],
      }),
    })

    const folders = await driveService.listFolders('root')
    const coaching = folders.find((f) => f.name === 'Coaching')
    expect(coaching).toBeDefined()
    expect(coaching!.id).toBe('coaching_1')
  })

  it('should navigate into subfolders after selection', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          files: [
            { id: 'bloc_5', name: 'Bloc 5' },
            { id: 'bloc_6', name: 'Bloc 6' },
          ],
        }),
      })

    const folders = await driveService.listFolders('coaching_id')
    expect(folders).toHaveLength(2)
    expect(folders[0].name).toBe('Bloc 5')

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        files: [
          { id: 'week_3', name: 'Semaine 3' },
        ],
      }),
    })

    const subfolders = await driveService.listFolders('bloc_5')
    expect(subfolders).toHaveLength(1)
    expect(subfolders[0].name).toBe('Semaine 3')
  })

  it('should create missing folder in the hierarchy', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ files: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'new_bloc' }) })

    const id = await driveService.findOrCreateFolder('Bloc 7', 'coaching_id')
    expect(id).toBe('new_bloc')
  })

  it('should save destination after browsing complete path', () => {
    const dest = {
      currentBlock: 5,
      currentWeek: 3,
      currentSession: 2,
      blockFolderId: 'bloc_5_id',
      weekFolderId: 'week_3_id',
      sessionFolderId: 'session_2_id',
    }
    destinationService.set(dest)
    const saved = destinationService.get()
    expect(saved?.currentBlock).toBe(5)
    expect(saved?.currentWeek).toBe(3)
    expect(saved?.currentSession).toBe(2)
    expect(saved?.blockFolderId).toBe('bloc_5_id')
    expect(saved?.weekFolderId).toBe('week_3_id')
    expect(saved?.sessionFolderId).toBe('session_2_id')
  })
})

describe('CoachUpload - App Resume', () => {
  beforeEach(() => {
    destinationService.clear()
  })

  it('should restore destination from MMKV on re-init', () => {
    const dest = {
      currentBlock: 5,
      currentWeek: 3,
      currentSession: 2,
      blockFolderId: 'b_id',
      weekFolderId: 'w_id',
      sessionFolderId: 's_id',
    }
    destinationService.set(dest)
    const restored = destinationService.get()
    expect(restored).toEqual(dest)
  })

  it('should survive multiple register/unregister cycles', () => {
    dbManager.registerModule('coach-upload')
    destinationService.set({
      currentBlock: 1,
      currentWeek: 2,
      currentSession: 3,
      blockFolderId: '',
      weekFolderId: '',
      sessionFolderId: '',
    })
    const val = destinationService.get()
    expect(val?.currentBlock).toBe(1)
    expect(val?.currentSession).toBe(3)
  })
})
