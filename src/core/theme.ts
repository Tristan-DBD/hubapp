export const theme = {
  bg: '#0a0a0f',
  surface: '#12121a',
  surfaceAlt: '#1a1a2b',
  border: '#2a2a40',
  primary: '#7c3aed',
  primaryLight: '#a78bfa',
  text: '#e8e8f0',
  textSecondary: '#8888a0',
  textMuted: '#555570',
  success: '#22c55e',
  danger: '#ef4444',
  inputBg: '#1a1a2b',
  cardBg: '#12121a',
  headerBg: '#0a0a0f',
}

export const navigationTheme = {
  dark: true,
  colors: {
    primary: theme.primary,
    background: theme.bg,
    card: theme.surface,
    text: theme.text,
    border: theme.border,
    notification: theme.primary,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '900' },
  },
}
