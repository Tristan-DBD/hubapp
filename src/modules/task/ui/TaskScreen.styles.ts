import { StyleSheet } from 'react-native'
import { theme } from '../../../core/theme'

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    backgroundColor: theme.bg,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: theme.primaryLight, flex: 1 },
  backBtn: { paddingRight: 12, paddingVertical: 4 },
  backBtnText: { fontSize: 22, color: theme.primaryLight },
  headerRight: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  toggleBtnActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  toggleBtnText: { color: theme.textSecondary, fontSize: 12 },
  toggleBtnTextActive: { color: '#fff' },
  addBtn: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  addBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  content: { flex: 1, paddingHorizontal: 16 },

  // Grid mode — category cards
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryCard: {
    width: '47%',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  categoryCardName: { fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 4 },
  categoryCardCount: { fontSize: 13, color: theme.textMuted },

  // List mode — category rows
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  categoryRowName: { fontSize: 16, fontWeight: '600', color: theme.text, flex: 1 },
  categoryRowCount: { fontSize: 13, color: theme.textMuted, marginRight: 8 },

  // List cards in category view
  listCard: {
    backgroundColor: theme.surface,
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  listCardName: { fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 2 },
  listCardType: { fontSize: 12, color: theme.textMuted },
  listCardCount: { fontSize: 12, color: theme.textSecondary, marginTop: 4 },

  // Checklist item
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: theme.surface,
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: { backgroundColor: theme.primary, borderColor: theme.primary },
  checkboxInner: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  checklistTitle: { color: theme.text, fontSize: 15, flex: 1 },
  checklistTitleDone: { color: theme.textMuted, textDecorationLine: 'line-through' },

  // Simple item
  simpleRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: theme.surface,
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  simpleTitle: { color: theme.text, fontSize: 15 },

  // Todo item
  todoRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: theme.surface,
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  list: { flex: 1 },
  todoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todoTitle: { color: theme.text, fontSize: 15, fontWeight: '500', flex: 1 },
  todoBadgeRow: { flexDirection: 'row', gap: 6, marginLeft: 8 },
  todoBadge: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, overflow: 'hidden' },
  priorityHigh: { backgroundColor: '#dc2626', color: '#fff' },
  priorityNormal: { backgroundColor: '#16a34a', color: '#fff' },
  priorityLow: { backgroundColor: '#52525b', color: '#fff' },
  todoBadgeStatus: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#2a2a40',
    color: '#a78bfa',
    overflow: 'hidden',
  },
  todoDesc: { color: theme.textMuted, fontSize: 13, marginTop: 6 },

  // Section header for todo groups
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textSecondary,
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Inline add input
  inlineAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: theme.surfaceAlt,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  inlineInput: {
    flex: 1,
    color: theme.text,
    fontSize: 15,
    padding: 0,
    margin: 0,
  },
  inlineInputPlaceholder: {
    color: '#555',
  },
  inlineAddIcon: {
    backgroundColor: theme.primary,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  inlineAddIconText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Modal overlay
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  overlayBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modal: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.primaryLight,
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.primaryLight,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.text,
    backgroundColor: theme.inputBg,
    marginBottom: 12,
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalCancelText: { color: theme.textSecondary, fontSize: 14 },
  modalConfirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: theme.primary,
  },
  modalConfirmText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Type picker rows
  typePickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typePickerBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  typePickerBtnActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  typePickerBtnText: { color: theme.textSecondary, fontSize: 12 },
  typePickerBtnTextActive: { color: '#fff' },

  // Priority picker
  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  todoBadgeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    opacity: 0.7,
  },
  todoBadgeBtnActive: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#fff',
  },
  todoBadgeBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Status picker (for long press)
  statusOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surfaceAlt,
  },
  statusOptionText: { color: theme.text, fontSize: 16 },
  statusDanger: { color: theme.danger },

  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 15, color: theme.textMuted },

  separator: { height: 1, backgroundColor: theme.border, marginVertical: 16 },

  confirmOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBox: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 24,
    width: '75%',
    borderWidth: 1,
    borderColor: theme.border,
  },
  confirmTitle: { fontSize: 17, fontWeight: '600', color: theme.text, marginBottom: 8, textAlign: 'center' },
  confirmMessage: { fontSize: 14, color: theme.textSecondary, marginBottom: 20, textAlign: 'center' },
  confirmActions: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  dangerBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: theme.danger,
  },
  dangerBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
})
