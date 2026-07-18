// screens/SettingsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Colors } from '../theme';

// ── Reusable round icon ──────────────────────────────────────────
function RoundIcon({
  color,
  children,
}: {
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={[
        styles.roundIcon,
        { backgroundColor: color || Colors.accentDim },
      ]}
    >
      {children}
    </View>
  );
}

// ── A single settings row ────────────────────────────────────────
function SettingsRow({
  icon,
  iconColor,
  label,
  desc,
  red,
  value,
  toggle,
  toggleOn,
  onToggle,
  onPress,
}: {
  icon: React.ReactNode;
  iconColor?: string;
  label: string;
  desc?: string;
  red?: boolean;
  value?: string;
  toggle?: boolean;
  toggleOn?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={toggle ? undefined : onPress}
      activeOpacity={0.6}
    >
      <RoundIcon color={red ? Colors.redBg : iconColor}>{icon}</RoundIcon>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, red && { color: Colors.red }]}>
          {label}
        </Text>
        {desc ? <Text style={styles.rowDesc}>{desc}</Text> : null}
      </View>
      {value && !toggle ? (
        <Text style={styles.rowValue}>{value}</Text>
      ) : null}
      {toggle ? (
        <Switch
          value={toggleOn}
          onValueChange={onToggle}
          trackColor={{ false: 'rgba(120,120,120,0.35)', true: '#30d158' }}
          thumbColor="white"
          style={{ marginLeft: 8 }}
        />
      ) : (
        <Text style={styles.chevron}>›</Text>
      )}
    </TouchableOpacity>
  );
}

// ── Section wrapper ──────────────────────────────────────────────
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────
export default function SettingsScreen({ navigation }: any) {
  const [isDark, setIsDark] = useState(true);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');

  const handleClearChats = () => {
    Alert.alert(
      'Clear all chats?',
      "All chats can't be recovered. Clear everything?",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: call clearChats function
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'End your session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          // TODO: call signOut function
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile row */}
        <Section title="Profile">
          <SettingsRow
            icon={
              <Text style={{ color: Colors.accent }}>👤</Text>
            }
            iconColor={Colors.accentDim}
            label="Profile"
            desc="Edit name & photo"
            onPress={() => navigation.navigate('Profile')}
          />
        </Section>

        {/* Personalization */}
        <Section title="Personalization">
          <SettingsRow
            icon={
              <Text style={{ color: Colors.accent }}>✏️</Text>
            }
            iconColor={Colors.accentDim}
            label="Personalization"
            desc="Tone, nickname, custom instructions"
            onPress={() => navigation.navigate('Personalization')}
          />
        </Section>

        {/* Account */}
        <Section title="Account">
          <SettingsRow
            icon={
              <Text style={{ color: Colors.accent }}>🚪</Text>
            }
            iconColor={Colors.accentDim}
            label="Sign out"
            desc="End your session"
            onPress={handleSignOut}
          />
        </Section>

        {/* Data */}
        <Section title="Data">
          <SettingsRow
            icon={
              <Text style={{ color: Colors.red }}>🗑️</Text>
            }
            iconColor={Colors.redBg}
            label="Clear all chats"
            desc="Permanently erase conversation history"
            red
            onPress={handleClearChats}
          />
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <SettingsRow
            icon={
              <Text style={{ color: Colors.accent }}>🌙</Text>
            }
            iconColor={Colors.accentDim}
            label="Dark Mode"
            desc="Override system preference"
            toggle
            toggleOn={isDark}
            onToggle={() => setIsDark(d => !d)}
          />
          <View style={[styles.row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.borderB }]}>
            <RoundIcon color={Colors.accentDim}>
              <Text style={{ color: Colors.accent, fontSize: 14 }}>Aa</Text>
            </RoundIcon>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Font Size</Text>
              <Text style={styles.rowDesc}>Adjust message text size</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {(['small', 'medium', 'large'] as const).map((size) => (
                <TouchableOpacity
                  key={size}
                  onPress={() => setFontSize(size)}
                  style={[
                    styles.fontOption,
                    fontSize === size && styles.fontOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.fontOptionText,
                      fontSize === size && styles.fontOptionTextActive,
                    ]}
                  >
                    {size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Section>

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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text1,
    fontFamily: 'System',
  },
  content: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 24 },
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
  roundIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: 15, fontWeight: '500', color: Colors.text1 },
  rowDesc: { fontSize: 12.5, color: Colors.text3, marginTop: 2 },
  rowValue: { fontSize: 15, color: Colors.text3, marginRight: 4 },
  chevron: { fontSize: 18, color: Colors.text3 },
  fontOption: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 4,
  },
  fontOptionActive: {
    backgroundColor: Colors.accentDim,
  },
  fontOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text3,
  },
  fontOptionTextActive: {
    color: Colors.accent,
  },
  footer: {
    textAlign: 'center',
    color: Colors.text3,
    fontSize: 12,
    paddingVertical: 24,
  },
});