import { StyleSheet } from 'react-native'
import { theme } from '../../../core/theme'

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: 16 },
  destCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  destTitle: { fontSize: 14, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 },
  destLine: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 2 },
  destNone: { fontSize: 14, color: theme.textMuted, fontStyle: 'italic', marginBottom: 8 },
  destBtn: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: theme.primary, alignItems: 'center' },
  destBtnText: { color: theme.primary, fontWeight: '600', fontSize: 13 },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  actionBtn: { backgroundColor: theme.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  uploadBtn: { backgroundColor: theme.success },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: theme.surfaceAlt, borderRadius: 8 },
  loadingText: { color: theme.textSecondary, fontSize: 13 },
  list: { paddingBottom: 40 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 15, color: theme.textMuted },
})
