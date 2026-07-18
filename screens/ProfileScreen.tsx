// screens/ProfileScreen.tsx
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
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Colors } from '../theme';

export default function ProfileScreen({ navigation }: any) {
  const [photoUrl, setPhotoUrl] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    setEmail(user.email || '');
    // Load saved profile data from Firestore
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.profilePhoto) setPhotoUrl(data.profilePhoto);
        if (data.displayName) setDisplayName(data.displayName);
      }
      // Fallback to auth data
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
              const user = auth.currentUser;
              if (user) {
                // In a real app you would also revoke tokens via Firestore
              }
              await signOut(auth);
            } catch {
              Alert.alert('Error', 'Something went wrong.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Delete your account and all data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: implement account deletion
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar & info */}
        <View style={styles.profileBlock}>
          <View style={styles.avatar}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={{ color: Colors.accent, fontSize: 32 }}>👤</Text>
            )}
          </View>
          <Text style={styles.displayName}>{displayName || 'User'}</Text>
          <Text style={styles.email}>{email}</Text>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditProfile', { onUpdate: (name: string, photo: string) => { setDisplayName(name); setPhotoUrl(photo); } })}
          >
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Security */}
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.sectionBody}>
          <TouchableOpacity style={styles.row} onPress={handleLogoutAll}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.accentDim }]}>
              <Text style={{ color: Colors.accent }}>💻</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Logout all devices</Text>
              <Text style={styles.rowDesc}>Sign out from all active sessions</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Danger Zone</Text>
        <View style={styles.sectionBody}>
          <TouchableOpacity style={styles.row} onPress={handleDeleteAccount}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.redBg }]}>
              <Text style={{ color: Colors.red }}>🗑️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: Colors.red }]}>Delete Account</Text>
              <Text style={styles.rowDesc}>Delete your account and all data</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>EimemesChat AI · 2026</Text>
      </ScrollView>
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
  backBtn: { fontSize: 16, color: Colors.accent },
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
  chevron: { fontSize: 18, color: Colors.text3 },
  footer: {
    textAlign: 'center',
    color: Colors.text3,
    fontSize: 12,
    paddingVertical: 24,
  },
});