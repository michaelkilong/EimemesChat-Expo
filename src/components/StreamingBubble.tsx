// StreamingBubble.tsx — v1.1 (Expo)
// v1.1: Uses MarkdownRenderer — syntax highlighting, math, citations all live during streaming.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import MarkdownRenderer from './MarkdownRenderer';
import SourcesList from './SourcesList';
import type { Source } from '../types';

interface Props {
  text: string;
  done: boolean;
  model: string;
  disclaimer: 'critical' | 'web' | false;
  time: string;
  sources?: Source[];
}

export default function StreamingBubble({ text, done, model, disclaimer, sources }: Props) {
  const { theme } = useApp();

  return (
    <View style={styles.container}>
      <View style={{ width: '100%' }}>

        {/* Live markdown rendering with streaming cursor ▌ */}
        <MarkdownRenderer
          text={text}
          streaming={!done}  // appends ▌ cursor when streaming
        />

        {/* Post-stream: disclaimers and sources — same as MessageBubble */}
        {done && (
          <>
            {disclaimer === 'critical' && (
              <View style={[styles.disclaimer, { borderLeftColor: theme.border }]}>
                <Text style={{ color: theme.text3, fontSize: 11.5, lineHeight: 17 }}>
                  For informational purposes only. Consult a qualified professional before making decisions.
                </Text>
              </View>
            )}
            {disclaimer === 'web' && (
              <View style={[styles.disclaimer, { borderLeftColor: theme.border }]}>
                <Text style={{ color: theme.text3, fontSize: 11.5, lineHeight: 17 }}>
                  Web sources may be outdated or inaccurate. Verify from authoritative sources.
                </Text>
              </View>
            )}
            {sources?.length ? <SourcesList sources={sources} /> : null}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { alignItems: 'flex-start', paddingVertical: 8 },
  disclaimer: { marginTop: 8, paddingVertical: 6, paddingLeft: 10, borderLeftWidth: 2 },
});
