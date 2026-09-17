// components/SignOutModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
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

export default function SignOutModal({ visible, loading, onClose, onConfirm }: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Sign out?</Text>
          <Text style={styles.body}>
            You'll need to sign back in to access your chats.
          </Text>

          <TouchableOpacity
            style={[styles.btn, styles.destructive]}
            onPress={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.destructiveText}>Sign out</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.cancel]}
            onPress={onClose}
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
    maxWidth: 320,
    backgroundColor: Colors.glass1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text1,
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    color: Colors.text3,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
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