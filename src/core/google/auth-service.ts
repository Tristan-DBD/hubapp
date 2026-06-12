import { GOOGLE_WEB_CLIENT_ID, GOOGLE_DRIVE_SCOPES } from '../config'
import { mmkvGet, mmkvSet, mmkvDelete } from '../db/storage/mmkv'
import { driveService } from './drive-service'

const TOKEN_KEY = 'googleAccessToken'

let _configured = false

async function ensureConfigured(): Promise<void> {
  if (_configured) {return}
  const { GoogleSignin } = await import('@react-native-google-signin/google-signin')
  GoogleSignin.configure({
    scopes: GOOGLE_DRIVE_SCOPES,
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    offlineAccess: false,
  })
  _configured = true
}

function formatError(error: any): string {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('DEVELOPER_ERROR')) {
    return (
      'Erreur de configuration Google. Pour utiliser Google Sign-In :\n\n' +
      '1. Va sur https://console.cloud.google.com/apis/credentials\n' +
      '2. Crée un projet et active l\'API Google Drive\n' +
      '3. Crée un écran de consentement OAuth (Externe)\n' +
      '4. Crée un ID client OAuth pour Android (package: com.hubapp)\n' +
      '5. Crée un ID client OAuth pour Web\n' +
      '6. Copie le client ID Web dans src/core/config.ts (GOOGLE_WEB_CLIENT_ID)\n' +
      '7. Ajoute l\'empreinte SHA-1 de ton keystore de debug dans la console\n\n' +
      'Pour obtenir le SHA-1 : keytool -list -v -keystore "%USERPROFILE%\\.android\\debug.keystore" -alias androiddebugkey -storepass android -keypass android'
    )
  }
  return `Erreur de connexion: ${message}`
}

function persistToken(token: string): void {
  mmkvSet(TOKEN_KEY, token)
}

export const authService = {
  async signIn(): Promise<void> {
    if (!GOOGLE_WEB_CLIENT_ID) {
      throw new Error(
        'Configuration Google manquante. Configure GOOGLE_WEB_CLIENT_ID dans src/core/config.ts'
      )
    }
    const { GoogleSignin, statusCodes } = await import('@react-native-google-signin/google-signin')
    await ensureConfigured()
    try {
      await GoogleSignin.hasPlayServices()
      await GoogleSignin.signIn()
      const tokens = await GoogleSignin.getTokens()
      const accessToken = tokens.accessToken
      if (!accessToken) {
        throw new Error('Aucun token d\'accès reçu')
      }
      persistToken(accessToken)
      driveService.setAccessToken(accessToken)
      driveService.onTokenRefresh(persistToken)
    } catch (error: any) {
      if (error?.code === statusCodes?.SIGN_IN_CANCELLED) {
        throw new Error('Connexion annulée')
      }
      if (error?.code === statusCodes?.IN_PROGRESS) {
        throw new Error('Connexion en cours')
      }
      if (error?.code === statusCodes?.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services non disponibles')
      }
      throw new Error(formatError(error))
    }
  },

  async signOut(): Promise<void> {
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin')
    try {
      await GoogleSignin.signOut()
    } finally {
      mmkvDelete(TOKEN_KEY)
      driveService.clearAccessToken()
    }
  },

  isSignedIn(): boolean {
    return driveService.isAuthenticated()
  },

  async restoreToken(): Promise<boolean> {
    driveService.onTokenRefresh(persistToken)
    try {
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin')
      await ensureConfigured()
      const tokens = await GoogleSignin.getTokens()
      if (tokens.accessToken) {
        persistToken(tokens.accessToken)
        driveService.setAccessToken(tokens.accessToken)
        return true
      }
    } catch {
      // fallback to stored token
    }
    const stored = mmkvGet(TOKEN_KEY)
    if (stored) {
      driveService.setAccessToken(stored as string)
      return true
    }
    return false
  },

  clearToken(): void {
    mmkvDelete(TOKEN_KEY)
    driveService.clearAccessToken()
  },
}
