import { describe, it, expect, vi, beforeEach } from 'vitest'

function makeMockDriveService() {
  return {
    driveService: {
      setAccessToken: vi.fn(),
      clearAccessToken: vi.fn(),
      isAuthenticated: vi.fn().mockReturnValue(true),
      onTokenRefresh: vi.fn(),
      listFolders: vi.fn().mockResolvedValue([]),
      findOrCreateFolder: vi.fn().mockResolvedValue('mock-folder-id'),
      uploadFile: vi.fn().mockResolvedValue('file-id-123'),
    },
  }
}

describe('Core - Drive Service', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('lists folders', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        files: [
          { id: 'f1', name: 'Folder 1' },
          { id: 'f2', name: 'Folder 2' },
        ],
      }),
    })
    vi.stubGlobal('fetch', mockFetch)
    vi.doMock('@react-native-google-signin/google-signin', () => ({
      GoogleSignin: {
        configure: vi.fn(),
        getTokens: vi.fn().mockResolvedValue({ accessToken: 'token' }),
      },
    }))

    const { driveService } = await import('../drive-service')
    driveService.setAccessToken('test-token')
    const folders = await driveService.listFolders()

    expect(folders).toHaveLength(2)
    expect(folders[0].name).toBe('Folder 1')
  })

  it('creates a folder', async () => {
    let callCount = 0
    const mockFetch = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ files: [] }) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 'new-folder-id' }) })
    })
    vi.stubGlobal('fetch', mockFetch)

    const { driveService } = await import('../drive-service')
    driveService.setAccessToken('test-token')
    const id = await driveService.findOrCreateFolder('New Folder', 'parent-id')

    expect(id).toBe('new-folder-id')
  })

  it('finds existing folder without creating', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        files: [{ id: 'existing-id', name: 'Existing' }],
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const { driveService } = await import('../drive-service')
    driveService.setAccessToken('test-token')
    const id = await driveService.findOrCreateFolder('Existing', 'parent-id')

    expect(id).toBe('existing-id')
  })

  it('refreshes token on 401 and retries', async () => {
    let callCount = 0
    const mockFetch = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {return Promise.resolve({ status: 401, ok: false })}
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ files: [] }) })
    })
    vi.stubGlobal('fetch', mockFetch)

    vi.doMock('@react-native-google-signin/google-signin', () => ({
      GoogleSignin: {
        configure: vi.fn(),
        getTokens: vi.fn().mockResolvedValue({ accessToken: 'new-token' }),
      },
    }))

    const { driveService } = await import('../drive-service')
    driveService.setAccessToken('stale-token')
    const folders = await driveService.listFolders()

    expect(folders).toEqual([])
  })
})

describe('Core - Auth Service', () => {
  beforeEach(async () => {
    vi.resetModules()
  })

  it('restores token from GoogleSignin', async () => {
    vi.doMock('../drive-service', () => makeMockDriveService())
    const mockGetTokens = vi.fn().mockResolvedValue({ accessToken: 'fresh-token' })
    vi.doMock('@react-native-google-signin/google-signin', () => ({
      GoogleSignin: {
        configure: vi.fn(),
        getTokens: mockGetTokens,
      },
    }))

    const { authService } = await import('../auth-service')
    const result = await authService.restoreToken()

    expect(result).toBe(true)
  })

  it('falls back to stored token when GoogleSignin fails', async () => {
    vi.doMock('../drive-service', () => makeMockDriveService())
    vi.doMock('@react-native-google-signin/google-signin', () => ({
      GoogleSignin: {
        configure: vi.fn(),
        getTokens: vi.fn().mockRejectedValue(new Error('Not signed in')),
      },
    }))
    const { mmkvDelete } = await import('../../db/storage/mmkv')
    mmkvDelete('googleAccessToken')

    const { authService } = await import('../auth-service')
    const result = await authService.restoreToken()

    expect(result).toBe(false)
  })

  it('signs out and clears token', async () => {
    vi.doMock('../drive-service', () => makeMockDriveService())
    const mockSignOut = vi.fn().mockResolvedValue(undefined)
    vi.doMock('@react-native-google-signin/google-signin', () => ({
      GoogleSignin: { signOut: mockSignOut },
    }))

    const { authService } = await import('../auth-service')
    await authService.signOut()

    expect(mockSignOut).toHaveBeenCalled()
  })

  it('isSignedIn returns false without token', () => {
    const { authService } = { authService: { isSignedIn: () => false } }
    expect(authService.isSignedIn()).toBe(false)
  })
})

describe('Core - Compression', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('compresses video', async () => {
    const mockCompress = vi.fn().mockResolvedValue('/compressed/video.mp4')
    vi.doMock('react-native-compressor', () => ({
      Video: { compress: mockCompress },
    }))

    const { compressVideo } = await import('../../compression/video-service')
    const result = await compressVideo('/original/video.mp4')

    expect(result).toBe('/compressed/video.mp4')
  })

  it('compresses image', async () => {
    const mockCompress = vi.fn().mockResolvedValue('/compressed/photo.jpg')
    vi.doMock('react-native-compressor', () => ({
      Image: { compress: mockCompress },
    }))

    const { compressImage } = await import('../../compression/image-service')
    const result = await compressImage('/original/photo.jpg')

    expect(result).toBe('/compressed/photo.jpg')
  })

  it('reports video compression progress', async () => {
    const onProgress = vi.fn()
    const mockCompress = vi.fn().mockImplementation((_uri, opts) => {
      opts.getProgress?.(50)
      return Promise.resolve('/compressed/video.mp4')
    })
    vi.doMock('react-native-compressor', () => ({
      Video: { compress: mockCompress },
    }))

    const { compressVideo } = await import('../../compression/video-service')
    await compressVideo('/original/video.mp4', onProgress)

    expect(onProgress).toHaveBeenCalledWith(0.5)
  })
})
