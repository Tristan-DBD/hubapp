import { StyleSheet } from 'react-native'
import { theme } from '../../../core/theme'

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: theme.text, marginBottom: 16, textAlign: 'center' },
  destCard: { backgroundColor: theme.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
  destLabel: { fontSize: 14, fontWeight: '600', color: theme.textSecondary, marginBottom: 4 },
  destValue: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 10 },
  destBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: theme.primary, alignItems: 'center' },
  destBtnText: { color: theme.primary, fontWeight: '600', fontSize: 13 },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  actionBtn: { backgroundColor: theme.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  uploadBtn: { backgroundColor: theme.success },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  list: { paddingBottom: 40 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 15, color: theme.textMuted },
})
