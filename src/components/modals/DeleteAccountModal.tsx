// DeleteAccountModal.tsx — v1.0 (Expo)
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { deleteUser } from 'firebase/auth';
import { writeBatch, getDocs, doc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { useApp } from '../../context/AppContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  getUserConvsRef: () => any;
}

export default function DeleteAccountModal({ visible, onClose, getUserConvsRef }: Props) {
  const { currentUser, theme, showToast } = useApp();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const convsRef = getUserConvsRef();
      if (convsRef) {
        const snap  = await getDocs(convsRef);
        const batch = writeBatch(db);
        snap.docs.forEach((d: any) => batch.delete(d.ref));
        batch.delete(doc(db, 'users', currentUser.uid));
        await batch.commit();
      }
      await deleteUser(currentUser);
      onClose();
      showToast('Account deleted. Goodbye 👋');
    } catch (err: any) {
      setLoading(false);
      onClose();
      if (err.code === 'auth/requires-recent-login') {
        showToast('Please sign out and sign back in first, then try again.');
      } else {
        showToast('Deletion failed. Please try again.');
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.bgA, borderColor: 'rgba(255,75,75,0.22)' }]}>

          <View style={[styles.iconBox, { backgroundColor: 'rgba(255,75,75,0.12)', borderColor: 'rgba(255,75,75,0.2)' }]}>
            <Text style={{ fontSize: 26 }}>🗑</Text>
          </View>

          <Text style={[styles.title, { color: theme.text1 }]}>Delete account?</Text>
          <Text style={[styles.body, { color: theme.text3 }]}>
            This action is permanent and cannot be undone. All your conversations and data will be erased forever.
          </Text>

          <View style={styles.warningBox}>
            <Text style={{ color: '#ff6b6b', fontSize: 12.5, lineHeight: 19 }}>
              ⚠️ You will be immediately signed out and your account will be deleted. This cannot be reversed.
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleDelete}
            disabled={loading}
            activeOpacity={0.8}
            style={[styles.btnRed, { opacity: loading ? 0.4 : 1 }]}
          >
            <Text style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>
              {loading ? 'Deleting…' : 'Yes, delete my account'}
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
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  card:       { width: '100%', maxWidth: 380, borderRadius: 24, padding: 24, borderWidth: 1, alignItems: 'center' },
  iconBox:    { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1 },
  title:      { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  body:       { fontSize: 13.5, lineHeight: 21, marginBottom: 14, textAlign: 'center' },
  warningBox: { backgroundColor: 'rgba(255,75,75,0.08)', borderWidth: 1, borderColor: 'rgba(255,75,75,0.15)', borderRadius: 12, padding: 10, marginBottom: 20, alignSelf: 'stretch' },
  btnRed:     { width: '100%', padding: 14, borderRadius: 40, backgroundColor: '#cc2c2c', alignItems: 'center', marginBottom: 10 },
  btnCancel:  { width: '100%', padding: 14, borderRadius: 40, borderWidth: 1, alignItems: 'center' },
});
