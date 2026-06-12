// Google OAuth configuration
// To use Google Sign-In, create OAuth 2.0 credentials in Google Cloud Console
// and set the webClientId here (NOT the Android client ID, but the Web application one).
export const GOOGLE_WEB_CLIENT_ID = '939015909767-7md83f6vd83cacq7n0gqcft5fct18gcn.apps.googleusercontent.com'

export const GOOGLE_DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive']

// Upload
export const UPLOAD_TIMEOUT_MS = 300_000
export const PROGRESS_THROTTLE_MS = 300

// Slide-out animation
export const ANIM_SLIDE_DELAY = 1500
export const ANIM_SLIDE_DURATION = 350
export const ANIM_SLIDE_OFFSET = 500

// Compression
export const IMAGE_COMPRESSION_QUALITY = 0.7
export const VIDEO_COMPRESSION_QUALITY = 'high' as const
export const VIDEO_COMPRESSION_PROGRESS_DIVIDER = 10
