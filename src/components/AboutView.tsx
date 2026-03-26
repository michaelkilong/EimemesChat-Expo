// AboutView.tsx — v1.0 (Expo)
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

interface Props {
  onBack: () => void;
  onOpenLicenses: () => void;
}

function Row({ label, value }: { label: string; value: string }) {
  const { theme } = useApp();
  return (
    <View style={[styles.row, { borderBottomColor: theme.borderB }]}>
      <Text style={{ fontSize: 15, color: theme.text2 }}>{label}</Text>
      <Text style={{ fontSize: 15, color: theme.text3 }}>{value}</Text>
    </View>
  );
}

export default function AboutView({ onBack, onOpenLicenses }: Props) {
  const { theme } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={[styles.circleBtn, { backgroundColor: 'rgba(255,255,255,0.22)', borderColor: 'rgba(255,255,255,0.35)' }]}
        >
          <Text style={{ color: theme.text1, fontSize: 20 }}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text1 }]}>About</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* App identity */}
        <View style={styles.identity}>
          {/* App icon */}
          <View style={styles.iconBox}>
            <LinearGradient
              colors={['#1a1040', '#0d0820']}
              style={StyleSheet.absoluteFillObject}
            />
            <LinearGradient
              colors={['#5e9cff', '#c96eff']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.eLetter}
            >
              <Text style={{ fontSize: 42, fontWeight: '700', color: '#fff' }}>E</Text>
            </LinearGradient>
          </View>

          <Text style={{ fontSize: 22, fontWeight: '700', color: theme.text1, marginTop: 8 }}>
            EimemesChat AI
          </Text>
          <Text style={{ fontSize: 14, color: theme.text3 }}>
            Version 4.0 · Built by Eimemes AI Team
          </Text>
        </View>

        {/* Info rows */}
        <View style={[styles.infoCard, { backgroundColor: theme.glass2, borderColor: theme.border }]}>
          <Row label="Developer"  value="Michael Kilong" />
          <Row label="Version"    value="4.0.0" />
          <Row label="Platform"   value="Android / iOS" />
          <Row label="AI Model"   value="Llama 3 via Groq" />
          <Row label="Released"   value="2026" />
        </View>

        {/* Description */}
        <View style={[styles.descCard, { backgroundColor: theme.glass2 }]}>
          <Text style={{ fontSize: 14, color: theme.text2, lineHeight: 23 }}>
            EimemesChat AI is an intelligent chat assistant built for everyone, with a special focus on the Thadou Kuki community of Northeast India. Powered by advanced AI, it supports file reading, personalization, and natural conversation.
          </Text>
        </View>

        {/* Open Source Licenses */}
        <TouchableOpacity
          onPress={onOpenLicenses}
          activeOpacity={0.7}
          style={[styles.licensesRow, { backgroundColor: theme.glass2 }]}
        >
          <View>
            <Text style={{ fontSize: 15, fontWeight: '500', color: theme.text1 }}>Open Source Licenses</Text>
            <Text style={{ fontSize: 13, color: theme.text3, marginTop: 2 }}>Third-party libraries used in this app</Text>
          </View>
          <Text style={{ color: theme.text3, fontSize: 16 }}>›</Text>
        </TouchableOpacity>

        <Text style={{ textAlign: 'center', fontSize: 12, color: theme.text3, marginTop: 8 }}>
          © 2026 Michael Kilong · MIT License
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header:    { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingBottom: 16 },
  circleBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title:     { fontSize: 20, fontWeight: '700' },
  identity:  { alignItems: 'center', paddingVertical: 32, gap: 6 },
  iconBox:   { width: 80, height: 80, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  eLetter:   { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  infoCard:  { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  descCard:  { padding: 16, borderRadius: 16, marginBottom: 16 },
  licensesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, marginBottom: 16 },
});
