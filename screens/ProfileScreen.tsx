// screens/ProfileScreen.tsx — v1.2 (Ionicons instead of emojis)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut, deleteUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Colors } from '../theme';
import DeleteAccountModal from '../components/DeleteAccountModal';

export default function ProfileScreen({ navigation }: any) {
  const [photoUrl, setPhotoUrl] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    setEmail(user.email || '');
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.profilePhoto) setPhotoUrl(data.profilePhoto);
        if (data.displayName) setDisplayName(data.displayName);
      }
      if (!displayName) setDisplayName(user.displayName || user.email?.split('@')[0] || 'User');
      if (!photoUrl) setPhotoUrl(user.photoURL || '');
    });
  }, []);

  const handleLogoutAll = () => {
    Alert.alert(
      'Logout all devices?',
      'All active sessions will be signed out. You will need to sign back in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout all',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
            } catch {
              Alert.alert('Error', 'Something went wrong.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setDeleting(true);
    try {
      await deleteUser(user);
      setDeleteVisible(false);
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Re-authentication required',
          'Please sign out and sign back in, then try again.'
        );
      } else {
        Alert.alert('Error', 'Could not delete account. Try again.');
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={Colors.accent} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar & info */}
        <View style={styles.profileBlock}>
          <View style={styles.avatar}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={38} color={Colors.accent} />
            )}
          </View>
          <Text style={styles.displayName}>{displayName || 'User'}</Text>
          <Text style={styles.email}>{email}</Text>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() =>
              navigation.navigate('EditProfile', {
                onUpdate: (name: string, photo: string) => {
                  setDisplayName(name);
                  setPhotoUrl(photo);
                },
              })
            }
          >
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Security */}
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.sectionBody}>
          <TouchableOpacity style={styles.row} onPress={handleLogoutAll}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.accentDim }]}>
              <Ionicons name="desktop-outline" size={18} color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Logout all devices</Text>
              <Text style={styles.rowDesc}>Sign out from all active sessions</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.text3} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Danger Zone</Text>
        <View style={styles.sectionBody}>
          <TouchableOpacity style={styles.row} onPress={() => setDeleteVisible(true)}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.redBg }]}>
              <Ionicons name="trash-outline" size={18} color={Colors.red} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: Colors.red }]}>Delete Account</Text>
              <Text style={styles.rowDesc}>Delete your account and all data</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.text3} />
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>EimemesChat AI · 2026</Text>
      </ScrollView>

      <DeleteAccountModal
        visible={deleteVisible}
        loading={deleting}
        onClose={() => setDeleteVisible(false)}
        onConfirm={handleDeleteAccount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgA },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.glass1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderB,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text1 },
  content: { padding: 20, paddingBottom: 40 },
  profileBlock: {
    alignItems: 'center',
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderB,
    marginBottom: 24,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  avatarImage: { width: '100%', height: '100%' },
  displayName: { fontSize: 22, fontWeight: '700', color: Colors.text1, marginBottom: 4 },
  email: { fontSize: 14, color: Colors.text3, marginBottom: 16 },
  editBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.accentDim,
  },
  editBtnText: { color: Colors.accent, fontWeight: '600', fontSize: 14 },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Colors.text3,
    marginBottom: 8,
    paddingLeft: 4,
  },
  sectionBody: {
    backgroundColor: Colors.glass2,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderB,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: 15, fontWeight: '500', color: Colors.text1 },
  rowDesc: { fontSize: 12.5, color: Colors.text3, marginTop: 2 },
  footer: {
    textAlign: 'center',
    color: Colors.text3,
    fontSize: 12,
    paddingVertical: 24,
  },
});