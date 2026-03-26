// SyntaxBlock.tsx — v1.0 (Expo)
// Syntax-highlighted code block matching the web app's code-block exactly:
//   - Language label top-left
//   - "Copy" button top-right (becomes "Copied!" for 2s)
//   - highlight.js atomOneDark theme
//   - Rounded container matching web glass style
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import SyntaxHighlighter from 'react-native-syntax-highlighter';
import { atomOneDark, atomOneLight } from 'react-syntax-highlighter/styles/hljs';
import * as Clipboard from 'expo-clipboard';
import { haptic } from './haptic';
import { useApp } from '../context/AppContext';

interface Props {
  code: string;
  lang: string;
}

export default function SyntaxBlock({ code, lang }: Props) {
  const { theme, isDark, showToast } = useApp();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code.trim());
    haptic.success();
    setCopied(true);
    showToast('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const displayLang = lang ? lang.toLowerCase() : 'code';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#282c34' : '#f6f8fa' }]}>
      {/* Header — language label + copy button, exactly like web */}
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
        <Text style={[styles.langLabel, { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)' }]}>
          {displayLang}
        </Text>
        <TouchableOpacity
          onPress={handleCopy}
          activeOpacity={0.7}
          style={[
            styles.copyBtn,
            { backgroundColor: copied ? 'rgba(48,209,88,0.15)' : 'rgba(255,255,255,0.07)' },
          ]}
        >
          <Text style={[styles.copyBtnText, { color: copied ? '#30d158' : (isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)') }]}>
            {copied ? 'Copied!' : 'Copy'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Code — horizontally scrollable */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <SyntaxHighlighter
          language={displayLang}
          style={isDark ? atomOneDark : atomOneLight}
          fontSize={13}
          highlighter="hljs"
          customStyle={{
            backgroundColor: 'transparent',
            margin: 0,
            padding: 0,
          }}
        >
          {code.trim()}
        </SyntaxHighlighter>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    marginVertical: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  langLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'monospace',
    letterSpacing: 0.3,
  },
  copyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
