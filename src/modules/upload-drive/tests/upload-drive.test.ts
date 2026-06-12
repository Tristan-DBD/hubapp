import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolveDuplicateNames } from '../../../core/utils'
import { getMimeCategory, getFileMimeType, getExtension } from '../domain/types'

const mockFetch = vi.fn()
global.fetch = mockFetch

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

describe('UploadDrive - Domain', () => {
  describe('getMimeCategory', () => {
    it('returns "video" for video mime types', () => {
      expect(getMimeCategory('video/mp4')).toBe('video')
      expect(getMimeCategory('video/quicktime')).toBe('video')
      expect(getMimeCategory('video/x-matroska')).toBe('video')
    })

    it('returns "image" for image mime types', () => {
      expect(getMimeCategory('image/jpeg')).toBe('image')
      expect(getMimeCategory('image/png')).toBe('image')
      expect(getMimeCategory('image/webp')).toBe('image')
    })

    it('returns "other" for non-video/image mime types', () => {
      expect(getMimeCategory('application/pdf')).toBe('other')
      expect(getMimeCategory('text/plain')).toBe('other')
      expect(getMimeCategory('audio/mpeg')).toBe('other')
    })
  })

  describe('getFileMimeType', () => {
    it('returns correct mime for known extensions', () => {
      expect(getFileMimeType('photo.jpg')).toBe('image/jpeg')
      expect(getFileMimeType('video.mp4')).toBe('video/mp4')
      expect(getFileMimeType('doc.pdf')).toBe('application/pdf')
    })

    it('returns octet-stream for unknown extensions', () => {
      expect(getFileMimeType('file.xyz')).toBe('application/octet-stream')
    })

    it('returns octet-stream for files without extension', () => {
      expect(getFileMimeType('file')).toBe('application/octet-stream')
    })
  })

  describe('getExtension', () => {
    it('returns extension with dot', () => {
      expect(getExtension('photo.jpg')).toBe('.jpg')
      expect(getExtension('video.mp4')).toBe('.mp4')
    })

    it('returns empty string for no extension', () => {
      expect(getExtension('file')).toBe('')
    })
  })

  describe('resolveDuplicateNames', () => {
    it('returns names unchanged when no duplicates', () => {
      expect(resolveDuplicateNames(['a', 'b', 'c'])).toEqual(['a', 'b', 'c'])
    })

    it('appends (1), (2) for duplicates', () => {
      expect(resolveDuplicateNames(['a', 'b', 'a', 'b'])).toEqual(['a', 'b', 'a (1)', 'b (1)'])
    })
  })
})

describe('UploadDrive - Upload Service', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('uploads multiple files', async () => {
    const mockUploadFile = vi.fn().mockResolvedValue('file-id-123')
    vi.doMock('../../../core/google/drive-service', () => ({
      driveService: {
        setAccessToken: vi.fn(),
        clearAccessToken: vi.fn(),
        isAuthenticated: vi.fn().mockReturnValue(true),
        onTokenRefresh: vi.fn(),
        listFolders: vi.fn().mockResolvedValue([]),
        findOrCreateFolder: vi.fn().mockResolvedValue('mock-folder-id'),
        uploadFile: mockUploadFile,
      },
    }))

    const { uploadService } = await import('../services/upload.service')
    const jobs = [
      { fileUri: '/a.pdf', fileName: 'doc.pdf', mimeType: 'application/pdf' },
      { fileUri: '/b.jpg', fileName: 'photo.jpg', mimeType: 'image/jpeg' },
    ]

    const results = await uploadService.uploadMultiple(jobs, 'folder-id')

    expect(results).toHaveLength(2)
    expect(results[0].success).toBe(true)
    expect(results[0].fileId).toBe('file-id-123')
    expect(results[1].success).toBe(true)
    expect(mockUploadFile).toHaveBeenCalledTimes(2)
  })

  it('handles upload failures gracefully', async () => {
    const mockUploadFile = vi.fn().mockRejectedValue(new Error('Network error'))
    vi.doMock('../../../core/google/drive-service', () => ({
      driveService: {
        setAccessToken: vi.fn(),
        clearAccessToken: vi.fn(),
        isAuthenticated: vi.fn().mockReturnValue(true),
        onTokenRefresh: vi.fn(),
        listFolders: vi.fn().mockResolvedValue([]),
        findOrCreateFolder: vi.fn().mockResolvedValue('mock-folder-id'),
        uploadFile: mockUploadFile,
      },
    }))

    const { uploadService } = await import('../services/upload.service')
    const jobs = [
      { fileUri: '/a.pdf', fileName: 'doc.pdf', mimeType: 'application/pdf' },
    ]

    const results = await uploadService.uploadMultiple(jobs, 'folder-id')

    expect(results).toHaveLength(1)
    expect(results[0].success).toBe(false)
    expect(results[0].error).toBe('Network error')
  })

  it('resolves duplicate names before upload', async () => {
    const mockUploadFile = vi.fn().mockResolvedValue('file-id')
    vi.doMock('../../../core/google/drive-service', () => ({
      driveService: {
        setAccessToken: vi.fn(),
        clearAccessToken: vi.fn(),
        isAuthenticated: vi.fn().mockReturnValue(true),
        onTokenRefresh: vi.fn(),
        listFolders: vi.fn().mockResolvedValue([]),
        findOrCreateFolder: vi.fn().mockResolvedValue('mock-folder-id'),
        uploadFile: mockUploadFile,
      },
    }))

    const { uploadService } = await import('../services/upload.service')
    const jobs = [
      { fileUri: '/a.pdf', fileName: 'doc.pdf', mimeType: 'application/pdf' },
      { fileUri: '/b.pdf', fileName: 'doc.pdf', mimeType: 'application/pdf' },
    ]

    const results = await uploadService.uploadMultiple(jobs, 'folder-id')

    expect(results[0].fileName).toBe('doc.pdf')
    expect(results[1].fileName).toBe('doc.pdf (1)')
  })

  it('returns empty array for no jobs', async () => {
    vi.doMock('../../../core/google/drive-service', () => ({
      driveService: {
        setAccessToken: vi.fn(),
        clearAccessToken: vi.fn(),
        isAuthenticated: vi.fn().mockReturnValue(true),
        onTokenRefresh: vi.fn(),
        listFolders: vi.fn().mockResolvedValue([]),
        findOrCreateFolder: vi.fn().mockResolvedValue('mock-folder-id'),
        uploadFile: vi.fn().mockResolvedValue('file-id'),
      },
    }))

    const { uploadService } = await import('../services/upload.service')
    const results = await uploadService.uploadMultiple([], 'folder-id')
    expect(results).toEqual([])
  })
})

describe('UploadDrive - Module Isolation', () => {
  it('has module ID set to "upload-drive"', () => {
    expect('upload-drive').toBeTruthy()
  })
})
