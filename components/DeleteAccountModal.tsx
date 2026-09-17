// components/DeleteAccountModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../theme';

interface Props {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const CONFIRM_WORD = 'DELETE';

export default function DeleteAccountModal({ visible, loading, onClose, onConfirm }: Props) {
  const [confirmText, setConfirmText] = useState('');
  const canDelete = confirmText.trim().toUpperCase() === CONFIRM_WORD;

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Delete account?</Text>
          <Text style={styles.body}>
            This will permanently delete your account and all your chats. This action cannot be undone.
          </Text>

          <Text style={styles.hint}>
            Type <Text style={{ color: Colors.red, fontWeight: '700' }}>{CONFIRM_WORD}</Text> to confirm
          </Text>

          <TextInput
            style={styles.input}
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder={CONFIRM_WORD}
            placeholderTextColor={Colors.text3}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.btn, styles.destructive, !canDelete && { opacity: 0.4 }]}
            onPress={onConfirm}
            disabled={!canDelete || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.destructiveText}>Delete my account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.cancel]}
            onPress={handleClose}
            disabled={loading}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.glass1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.red,
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontSize: 13.5,
    color: Colors.text3,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  hint: {
    fontSize: 12.5,
    color: Colors.text2,
    textAlign: 'center',
    marginBottom: 8,
  },
  input: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.redBorder,
    backgroundColor: Colors.bgA,
    color: Colors.text1,
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: 18,
  },
  btn: {
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  destructive: {
    backgroundColor: Colors.red,
  },
  destructiveText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  cancel: {
    backgroundColor: Colors.glass3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    color: Colors.text1,
    fontWeight: '600',
    fontSize: 15,
  },
});