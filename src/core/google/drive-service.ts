import { GOOGLE_WEB_CLIENT_ID, GOOGLE_DRIVE_SCOPES } from '../config'

interface DriveFolder {
  id: string;
  name: string;
  parents?: string[];
}

const API_BASE = 'https://www.googleapis.com/drive/v3'
const UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3'

let _accessToken: string | null = null
let _driveConfigured = false
let _onTokenRefresh: ((token: string) => void) | null = null
let _refreshPromise: Promise<boolean> | null = null

async function ensureDriveConfigured(): Promise<void> {
  if (_driveConfigured) {return}
  const { GoogleSignin } = await import('@react-native-google-signin/google-signin')
  GoogleSignin.configure({
    scopes: GOOGLE_DRIVE_SCOPES,
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    offlineAccess: false,
  })
  _driveConfigured = true
}

async function refreshAccessToken(): Promise<boolean> {
  if (_refreshPromise) {return _refreshPromise}
  _refreshPromise = (async () => {
    try {
      await ensureDriveConfigured()
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin')
      const tokens = await GoogleSignin.getTokens()
      if (tokens.accessToken) {
        _accessToken = tokens.accessToken
        _onTokenRefresh?.(tokens.accessToken)
        return true
      }
    } catch {
      // refresh failed
    }
    return false
  })()
  _refreshPromise.finally(() => { _refreshPromise = null })
  return _refreshPromise
}

async function request(url: string, options: RequestInit, retries = 1): Promise<Response> {
  const res = await fetch(url, options)
  if (res.status === 401 && retries > 0) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      const headers = {
        ...(options.headers as Record<string, string>),
        Authorization: `Bearer ${_accessToken}`,
      }
      return request(url, { ...options, headers }, retries - 1)
    }
  }
  return res
}

function getHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${_accessToken}`,
    'Content-Type': 'application/json',
  }
}

export const driveService = {
  setAccessToken(token: string): void {
    _accessToken = token
  },

  clearAccessToken(): void {
    _accessToken = null
  },

  isAuthenticated(): boolean {
    return _accessToken !== null
  },

  onTokenRefresh(cb: (token: string) => void): void {
    _onTokenRefresh = cb
  },

  async listFolders(parentId?: string): Promise<DriveFolder[]> {
    let query = 'mimeType=\'application/vnd.google-apps.folder\' and trashed=false'
    if (parentId) {
      query += ` and '${parentId}' in parents`
    }

    const params = new URLSearchParams({
      q: query,
      fields: 'files(id,name,parents)',
      orderBy: 'name',
    })

    const res = await request(`${API_BASE}/files?${params}`, {
      headers: getHeaders(),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Failed to list folders: ${res.status} ${errText}`)
    }

    const data = await res.json() as { files?: DriveFolder[] }
    return data.files || []
  },

  async findOrCreateFolder(name: string, parentId: string): Promise<string> {
    const existing = await this.listFolders(parentId)
    const match = existing.find((f) => f.name === name)
    if (match) {return match.id}

    const res = await request(`${API_BASE}/files`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Failed to create folder "${name}": ${res.status} ${errText}`)
    }

    const data = await res.json() as { id?: string }
    if (!data.id) {throw new Error('No folder ID returned from Drive')}
    return data.id
  },

  async uploadFile(
    fileUri: string,
    fileName: string,
    parentFolderId: string,
    mimeType: string,
    onProgress?: (progress: number) => void,
  ): Promise<string> {
    const metadata = JSON.stringify({
      name: fileName,
      parents: [parentFolderId],
      mimeType,
    })

    const sessionRes = await request(`${UPLOAD_BASE}/files?uploadType=resumable&fields=id`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${_accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': mimeType,
      },
      body: metadata,
    })

    if (!sessionRes.ok) {
      const errText = await sessionRes.text()
      throw new Error(`Failed to create upload session: ${sessionRes.status} ${errText}`)
    }

    const uploadUrl = sessionRes.headers.get('Location')
    if (!uploadUrl) {
      throw new Error('No upload URL returned from Drive')
    }

    const xhr = new XMLHttpRequest()

    return new Promise<string>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        xhr.abort()
        reject(new Error('L\'upload a pris trop de temps, vérifie ta connexion'))
      }, 300000)

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(event.loaded / event.total)
        }
      })

      xhr.addEventListener('load', () => {
        clearTimeout(timeoutId)
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText)
            resolve(data.id as string)
          } catch {
            resolve(xhr.responseText)
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`))
        }
      })

      xhr.addEventListener('error', () => {
        clearTimeout(timeoutId)
        reject(new Error(`Erreur réseau lors de l'upload (${xhr.status || 'aucune réponse'})`))
      })

      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('Authorization', `Bearer ${_accessToken}`)
      xhr.setRequestHeader('Content-Type', mimeType)
      xhr.send({ uri: fileUri, type: mimeType, name: fileName } as any)
    })
  },
}
