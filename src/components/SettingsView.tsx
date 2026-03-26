// SettingsView.tsx — v1.0 (Expo)
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Switch,
  ScrollView, StyleSheet, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useTheme } from '../hooks/useTheme';
import SignOutModal from './modals/SignOutModal';
import type { Conversation } from '../types';

interface Props {
  onBack: () => void;
  onOpenProfile: () => void;
  onOpenPersonalization: () => void;
  onOpenAbout: () => void;
  onClearChats: () => void;
  conversations: Conversation[];
}

function RoundIcon({ color, children }: { color?: string; children: React.ReactNode }) {
  return (
    <View style={[styles.roundIcon, { backgroundColor: color || 'transparent' }]}>
      {children}
    </View>
  );
}

function SettingsCard({
  icon, iconColor, label, desc, red, value, toggle, toggleOn, onToggle, onPress, nochevron,
}: {
  icon: React.ReactNode; iconColor?: string; label: string; desc?: string;
  red?: boolean; value?: string; toggle?: boolean; toggleOn?: boolean;
  onToggle?: () => void; onPress?: () => void; nochevron?: boolean;
}) {
  const { theme } = useApp();
  return (
    <TouchableOpacity
      onPress={toggle ? onToggle : onPress}
      activeOpacity={0.7}
      style={[styles.settingsCard, { backgroundColor: theme.glass2 }]}
    >
      <RoundIcon color={red ? 'rgba(255,75,75,0.25)' : (iconColor || theme.accentDim)}>
        {icon}
      </RoundIcon>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '500', color: red ? '#ff6b6b' : theme.text1 }}>{label}</Text>
        {desc && <Text style={{ fontSize: 13, color: theme.text3, marginTop: 1 }}>{desc}</Text>}
      </View>

      {value && !toggle && (
        <Text style={{ fontSize: 15, color: theme.text3, marginRight: 4 }}>{value}</Text>
      )}

      {toggle && (
        <Switch
          value={toggleOn}
          onValueChange={onToggle}
          trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#30d158' }}
          thumbColor="#fff"
        />
      )}

      {!toggle && !nochevron && (
        <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 16 }}>›</Text>
      )}
    </TouchableOpacity>
  );
}

export default function SettingsView({ onBack, onOpenProfile, onOpenPersonalization, onOpenAbout, onClearChats }: Props) {
  const { theme, currentUser, showToast, showConfirm } = useApp();
  const { isDark, toggleTheme } = useTheme();
  const [signOutVisible, setSignOutVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const handleClearChats = async () => {
    const yes = await showConfirm("All chats can't be recovered. Clear everything?", 'Delete', 'Clear all chats?');
    if (yes) { onClearChats(); showToast('All chats cleared.'); }
  };

  const sectionLabel = (text: string) => (
    <Text style={[styles.sectionLabel, { color: theme.text3 }]}>{text}</Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={[styles.backBtn, { backgroundColor: 'rgba(255,255,255,0.22)', borderColor: 'rgba(255,255,255,0.35)' }]}
        >
          <Text style={{ color: theme.text1, fontSize: 20 }}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text1 }]}>Settings</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        {currentUser && (
          <SettingsCard
            onPress={onOpenProfile}
            icon={<Text style={{ fontSize: 24 }}>👤</Text>}
            label={currentUser.displayName || 'User'}
            desc={currentUser.email || ''}
          />
        )}

        {sectionLabel('PERSONALIZATION')}

        <SettingsCard
          onPress={onOpenPersonalization}
          icon={<Text style={{ fontSize: 18 }}>✨</Text>}
          iconColor={theme.accentDim}
          label="Personalization"
          desc="Tone, nickname, custom instructions"
        />

        {sectionLabel('ACCOUNT')}

        <SettingsCard
          onPress={() => setSignOutVisible(true)}
          icon={<Text style={{ fontSize: 18 }}>↪</Text>}
          iconColor={theme.accentDim}
          label="Sign out"
          desc="End your session"
        />

        {sectionLabel('DATA')}

        <SettingsCard
          onPress={handleClearChats}
          icon={<Text style={{ fontSize: 18 }}>🗑</Text>}
          iconColor="rgba(255,75,75,0.25)"
          label="Clear all chats"
          desc="Permanently erase conversation history"
          red
        />

        {sectionLabel('APPEARANCE')}

        <SettingsCard
          icon={<Text style={{ fontSize: 18 }}>☀️</Text>}
          iconColor="rgba(255,255,255,0.1)"
          label="Dark Mode"
          desc="Override system preference"
          toggle
          toggleOn={isDark}
          onToggle={toggleTheme}
        />

        {sectionLabel('INFO')}

        <SettingsCard
          onPress={() => Linking.openURL('https://app-eimemeschat.vercel.app/privacy.html')}
          icon={<Text style={{ fontSize: 18 }}>🔒</Text>}
          iconColor={theme.accentDim}
          label="Privacy Policy"
          desc="How we handle your data"
        />

        <SettingsCard
          onPress={() => Linking.openURL('https://app-eimemeschat.vercel.app/support.html')}
          icon={<Text style={{ fontSize: 18 }}>❓</Text>}
          iconColor={theme.accentDim}
          label="Help & Support"
          desc="FAQ and contact"
        />

        <SettingsCard
          onPress={onOpenAbout}
          icon={<Text style={{ fontSize: 18 }}>ℹ️</Text>}
          iconColor={theme.accentDim}
          label="About"
          desc="EimemesChat AI · v4.0"
        />

        <Text style={{ textAlign: 'center', color: theme.text3, fontSize: 12, marginTop: 24 }}>
          EimemesChat AI · 2026
        </Text>
      </ScrollView>

      <SignOutModal visible={signOutVisible} onClose={() => setSignOutVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingBottom: 16 },
  backBtn:     { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title:       { fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
  sectionLabel:{ fontSize: 12, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 8, marginBottom: 8, paddingHorizontal: 4 },
  settingsCard:{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, paddingHorizontal: 16, borderRadius: 16, marginBottom: 10 },
  roundIcon:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
