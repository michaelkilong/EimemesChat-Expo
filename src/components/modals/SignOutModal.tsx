// SignOutModal.tsx — v1.0 (Expo)
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useApp } from '../../context/AppContext';

interface Props { visible: boolean; onClose: () => void; }

export default function SignOutModal({ visible, onClose }: Props) {
  const { theme, showToast } = useApp();
  const [loading, setLoading] = useState(false);

  const handleSignOut = () => {
    setLoading(true);
    showToast('Signing you out…');
    setTimeout(() => {
      signOut(auth)
        .catch(console.error)
        .finally(() => { setLoading(false); onClose(); });
    }, 1800);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.bgA, borderColor: theme.border }]}>

          <View style={[styles.iconBox, { backgroundColor: 'rgba(255,75,75,0.12)', borderColor: 'rgba(255,75,75,0.15)' }]}>
            <Text style={{ fontSize: 26 }}>↪</Text>
          </View>

          <Text style={[styles.title, { color: theme.text1 }]}>Sign out?</Text>
          <Text style={[styles.body, { color: theme.text3 }]}>
            You'll need to sign back in to access your conversations.
          </Text>

          <TouchableOpacity
            onPress={handleSignOut}
            disabled={loading}
            activeOpacity={0.8}
            style={[styles.btnRed, { opacity: loading ? 0.45 : 1 }]}
          >
            <Text style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>
              {loading ? 'Signing out…' : 'Yes, sign out'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            style={[styles.btnCancel, { backgroundColor: theme.glass3, borderColor: theme.border }]}
          >
            <Text style={{ color: theme.text2, fontSize: 15, fontWeight: '500' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  card:      { width: '100%', maxWidth: 360, borderRadius: 24, padding: 24, borderWidth: 1, alignItems: 'center' },
  iconBox:   { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1 },
  title:     { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  body:      { fontSize: 14, lineHeight: 21, marginBottom: 24, textAlign: 'center' },
  btnRed:    { width: '100%', padding: 14, borderRadius: 40, backgroundColor: '#cc2c2c', alignItems: 'center', marginBottom: 10 },
  btnCancel: { width: '100%', padding: 14, borderRadius: 40, borderWidth: 1, alignItems: 'center' },
});
