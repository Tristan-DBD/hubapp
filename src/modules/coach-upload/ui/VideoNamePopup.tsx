import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native'
import { theme } from '../../../core/theme'
import { generateFinalName, validateChargeInput } from '../domain/types'

const MOVEMENT_QUICK = ['squat', 'bench', 'deadlift']

interface VideoNamePopupProps {
  initialCharge: number | null;
  initialMovement: string;
  onCancel: () => void;
  onSave: (movement: string, charge: number | null) => void;
  visible: boolean;
}

export function VideoNamePopup({
  visible,
  initialMovement,
  initialCharge,
  onSave,
  onCancel,
}: VideoNamePopupProps) {
  const [movement, setMovement] = useState(initialMovement)
  const [chargeStr, setChargeStr] = useState(
    initialCharge !== null ? String(initialCharge).replace('.', ',') : '',
  )

  const preview = generateFinalName(movement, validateChargeInput(chargeStr))

  const handleSave = () => {
    const charge = validateChargeInput(chargeStr)
    onSave(movement.trim(), charge)
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <Text style={styles.title}>Nom de la vidéo</Text>

          <Text style={styles.label}>Mouvement</Text>
          <TextInput
            style={styles.input}
            value={movement}
            onChangeText={setMovement}
            placeholder="ex: squat"
            placeholderTextColor={theme.textMuted}
          />
          <View style={styles.quickRow}>
            {MOVEMENT_QUICK.map((m) => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.quickBtn,
                  movement === m && styles.quickBtnActive,
                ]}
                onPress={() => setMovement(m)}
              >
                <Text
                  style={[
                    styles.quickBtnText,
                    movement === m && styles.quickBtnTextActive,
                  ]}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Charge (optionnelle)</Text>
          <TextInput
            style={styles.input}
            value={chargeStr}
            onChangeText={setChargeStr}
            placeholder="ex: 197,5"
            placeholderTextColor={theme.textMuted}
            keyboardType="numeric"
          />

          {preview ? (
            <View style={styles.preview}>
              <Text style={styles.previewLabel}>Aperçu :</Text>
              <Text style={styles.previewText}>{preview}</Text>
            </View>
          ) : null}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, !movement.trim() && styles.disabled]}
              onPress={handleSave}
              disabled={!movement.trim()}
            >
              <Text style={styles.saveBtnText}>Valider</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  popup: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.primaryLight,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: theme.inputBg,
    color: theme.text,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quickBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.inputBg,
  },
  quickBtnActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  quickBtnText: {
    color: theme.textSecondary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  quickBtnTextActive: {
    color: '#fff',
  },
  preview: {
    marginTop: 16,
    padding: 12,
    backgroundColor: theme.surfaceAlt,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 12,
    color: theme.textMuted,
    marginBottom: 4,
  },
  previewText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.primaryLight,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: theme.textSecondary,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: theme.primary,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
})
