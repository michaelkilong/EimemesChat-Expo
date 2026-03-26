// LicensesView.tsx — v1.0 (Expo)
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

interface Props { onBack: () => void; }

const LICENSES = [
  { name: 'React Native', license: 'MIT', url: 'https://github.com/facebook/react-native' },
  { name: 'Expo', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'Firebase JS SDK', license: 'Apache 2.0', url: 'https://github.com/firebase/firebase-js-sdk' },
  { name: 'react-native-markdown-display', license: 'MIT', url: 'https://github.com/iamacup/react-native-markdown-display' },
  { name: '@react-native-google-signin/google-signin', license: 'MIT', url: 'https://github.com/react-native-google-signin/google-signin' },
  { name: 'expo-haptics', license: 'MIT', url: 'https://github.com/expo/expo/tree/main/packages/expo-haptics' },
  { name: 'expo-linear-gradient', license: 'MIT', url: 'https://github.com/expo/expo/tree/main/packages/expo-linear-gradient' },
  { name: 'expo-document-picker', license: 'MIT', url: 'https://github.com/expo/expo/tree/main/packages/expo-document-picker' },
  { name: 'expo-image-picker', license: 'MIT', url: 'https://github.com/expo/expo/tree/main/packages/expo-image-picker' },
  { name: 'expo-clipboard', license: 'MIT', url: 'https://github.com/expo/expo/tree/main/packages/expo-clipboard' },
  { name: '@react-native-async-storage/async-storage', license: 'MIT', url: 'https://github.com/react-native-async-storage/async-storage' },
  { name: 'react-native-safe-area-context', license: 'MIT', url: 'https://github.com/th3rdwave/react-native-safe-area-context' },
  { name: 'marked', license: 'MIT', url: 'https://github.com/markedjs/marked' },
  { name: 'highlight.js', license: 'BSD-3-Clause', url: 'https://github.com/highlightjs/highlight.js' },
  { name: 'KaTeX', license: 'MIT', url: 'https://github.com/KaTeX/KaTeX' },
];

export default function LicensesView({ onBack }: Props) {
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
        <Text style={[styles.title, { color: theme.text1 }]}>Open Source Licenses</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: theme.glass2, borderColor: theme.border }]}>
          {LICENSES.map((lib, i) => (
            <TouchableOpacity
              key={lib.name}
              onPress={() => Linking.openURL(lib.url).catch(() => {})}
              activeOpacity={0.7}
              style={[
                styles.row,
                { borderBottomColor: theme.borderB, borderBottomWidth: i < LICENSES.length - 1 ? 1 : 0 },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '500', color: theme.text1 }}>{lib.name}</Text>
                <Text style={{ fontSize: 12, color: theme.accent, marginTop: 2 }}>{lib.license}</Text>
              </View>
              <Text style={{ color: theme.text3, fontSize: 14 }}>↗</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header:    { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingBottom: 16 },
  circleBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title:     { fontSize: 18, fontWeight: '700', flex: 1 },
  card:      { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row:       { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16 },
});
