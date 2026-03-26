// ProfileView.tsx — v1.0 (Expo)
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { signOut } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../firebase';
import { useApp } from '../context/AppContext';
import DeleteAccountModal from './modals/DeleteAccountModal';

interface Props {
  onBack: () => void;
  getUserConvsRef: () => any;
}

function SettingsRow({ icon, label, desc, red, onPress }: {
  icon: string; label: string; desc?: string; red?: boolean; onPress?: () => void;
}) {
  const { theme } = useApp();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.row, { borderBottomColor: theme.borderB }]}
    >
      <Text style={{ fontSize: 18, width: 28 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: red ? '#ff6b6b' : theme.text1 }}>{label}</Text>
        {desc && <Text style={{ fontSize: 12.5, color: theme.text3, marginTop: 1 }}>{desc}</Text>}
      </View>
      <Text style={{ color: theme.text3, fontSize: 16 }}>›</Text>
    </TouchableOpacity>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  const { theme } = useApp();
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={[styles.sectionLabel, { color: theme.text3 }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: theme.glass2, borderColor: theme.border }]}>
        {children}
      </View>
    </View>
  );
}

export default function ProfileView({ onBack, getUserConvsRef }: Props) {
  const { currentUser, theme, showToast, showConfirm } = useApp();
  const [deleteVisible, setDeleteVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const handleLogoutAll = async () => {
    if (!currentUser) return;
    const yes = await showConfirm(
      'All active sessions will be signed out. You will need to sign back in.',
      'Logout all', 'Logout all devices?'
    );
    if (!yes) return;
    try {
      await setDoc(doc(db, 'users', currentUser.uid), { revokedAt: new Date().toISOString() }, { merge: true });
      showToast('Signing out from all devices…');
      setTimeout(() => signOut(auth).catch(console.error), 1400);
    } catch {
      showToast('Something went wrong. Please try again.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14, borderBottomColor: theme.borderB }]}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={[styles.backBtn, { backgroundColor: theme.glass3, borderColor: theme.borderB }]}
        >
          <Text style={{ color: theme.text2, fontSize: 18 }}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text1 }]}>Profile</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection title="Security">
          <SettingsRow
            icon="🖥"
            label="Logout all devices"
            desc="Sign out from all active sessions"
            onPress={handleLogoutAll}
          />
        </SettingsSection>

        <SettingsSection title="Danger Zone">
          <SettingsRow
            icon="🗑"
            label="Delete Account"
            desc="Permanently delete your account and all data"
            red
            onPress={() => setDeleteVisible(true)}
          />
        </SettingsSection>

        <Text style={{ textAlign: 'center', color: theme.text3, fontSize: 12, marginTop: 10 }}>
          EimemesChat AI · 2026
        </Text>
      </ScrollView>

      <DeleteAccountModal
        visible={deleteVisible}
        onClose={() => setDeleteVisible(false)}
        getUserConvsRef={getUserConvsRef}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn:     { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title:       { fontSize: 22, fontWeight: '700' },
  sectionLabel:{ fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 4, marginBottom: 8 },
  sectionCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 13, paddingHorizontal: 16, borderBottomWidth: 1 },
});
