// MessageList.tsx — v1.1 (Expo)
// v1.1: Fixed welcome screen gradient title (MaskedView removed, using accent text + gradient pill bg)
import React, { useRef, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MessageBubble from './MessageBubble';
import StreamingBubble from './StreamingBubble';
import TypingIndicator from './TypingIndicator';
import { useApp } from '../context/AppContext';
import { haptic } from '../lib/haptic';
import { getTime } from '../lib/markdown';
import type { Message } from '../types';

const CHIPS = [
  { label: 'Write a poem',              prompt: 'Write me a creative poem' },
  { label: 'Explain quantum computing', prompt: 'Explain quantum computing simply' },
  { label: 'Plan a trip',               prompt: 'Help me plan a trip' },
  { label: 'Debug my code',             prompt: 'Help me debug my code' },
];
const CHIP_ROWS = [[CHIPS[0]], [CHIPS[1], CHIPS[2]], [CHIPS[3]]];

interface Props {
  messages: Message[];
  isTyping: boolean;
  isSearching: boolean;
  isStreaming: boolean;
  streamText: string;
  streamDone: boolean;
  streamModel: string;
  streamDisclaimer: 'critical' | 'web' | false;
  streamSources: { title: string; url: string }[];
  convId: string | null;
  chipsUsed: boolean;
  onChipClick: (prompt: string) => void;
  onRegen: (originalMsg: string) => void;
}

// Gradient text via LinearGradient background + clipped container
function GradientTitle() {
  return (
    <View style={styles.gradientTitleWrap}>
      <LinearGradient
        colors={['#5e9cff', '#c96eff']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFillObject}
      />
      <Text style={styles.gradientTitleText}>EimemesChat AI</Text>
    </View>
  );
}

export default function MessageList({
  messages, isTyping, isSearching, isStreaming,
  streamText, streamDone, streamModel, streamDisclaimer, streamSources,
  convId, chipsUsed, onChipClick, onRegen,
}: Props) {
  const { theme } = useApp();
  const flatRef = useRef<FlatList>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const insets = useSafeAreaInsets();

  const showWelcome = messages.length === 0 && !isTyping && !isStreaming;

  const listData: Array<{ key: string; type: string; payload?: any }> = [];
  if (showWelcome) listData.push({ key: 'welcome', type: 'welcome' });
  messages.forEach((msg, i) => {
    const isLast = i === messages.length - 1 && msg.role === 'assistant' && !isStreaming;
    let lastUserMsg = '';
    if (isLast) {
      for (let j = i - 1; j >= 0; j--) {
        if (messages[j].role === 'user') { lastUserMsg = messages[j].content; break; }
      }
    }
    listData.push({ key: `msg-${i}`, type: 'message', payload: { msg, isLast, lastUserMsg } });
  });
  if (isTyping && !isSearching) listData.push({ key: 'typing',    type: 'typing' });
  if (isSearching)              listData.push({ key: 'searching', type: 'searching' });
  if (isStreaming)              listData.push({ key: 'streaming', type: 'streaming' });
  listData.push({ key: 'bottom', type: 'spacer' });

  const handleScroll = useCallback((e: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const dist = contentSize.height - contentOffset.y - layoutMeasurement.height;
    setShowScrollBtn(dist > 120);
  }, []);

  const renderItem = ({ item }: { item: typeof listData[0] }) => {
    switch (item.type) {
      case 'welcome':
        return (
          <View style={styles.welcomeContainer}>
            <GradientTitle />
            <Text style={{ fontSize: 17, color: theme.text3, fontWeight: '400', marginTop: 10 }}>
              How can I help you today?
            </Text>
            {!chipsUsed && (
              <View style={{ marginTop: 20, gap: 10, alignItems: 'center', width: '100%' }}>
                {CHIP_ROWS.map((row, ri) => (
                  <View key={ri} style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
                    {row.map(c => (
                      <TouchableOpacity
                        key={c.label}
                        onPress={() => { haptic.light(); onChipClick(c.prompt); }}
                        activeOpacity={0.7}
                        style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.glass2 }]}
                      >
                        <Text style={{ color: theme.text1, fontSize: 15, fontWeight: '500' }}>{c.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </View>
        );

      case 'message': {
        const { msg, isLast, lastUserMsg } = item.payload;
        return (
          <MessageBubble
            message={msg}
            isLast={isLast}
            lastUserMsg={lastUserMsg}
            convId={convId || ''}
            onRegen={onRegen}
          />
        );
      }

      case 'typing':
        return <TypingIndicator />;

      case 'searching':
        return (
          <View style={[styles.searchSkeleton, { backgroundColor: theme.glass2, borderColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent }} />
              <Text style={{ color: theme.text2, fontSize: 13, fontWeight: '500' }}>Searching the web…</Text>
            </View>
            {[92, 78, 85, 60].map((w, i) => (
              <View key={i} style={[styles.skeletonLine, { width: `${w}%`, backgroundColor: theme.glass3, marginBottom: 8 }]} />
            ))}
          </View>
        );

      case 'streaming':
        return (
          <StreamingBubble
            text={streamText} done={streamDone} model={streamModel}
            disclaimer={streamDisclaimer} time={getTime()} sources={streamSources}
          />
        );

      case 'spacer':
        return <View style={{ height: 20 }} />;

      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatRef}
        data={listData}
        keyExtractor={item => item.key}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24 }}
        onScroll={handleScroll}
        scrollEventThrottle={50}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      {showScrollBtn && (
        <TouchableOpacity
          onPress={() => { haptic.light(); flatRef.current?.scrollToEnd({ animated: true }); }}
          activeOpacity={0.7}
          style={[styles.scrollBtn, {
            backgroundColor: theme.glass1, borderColor: theme.border,
            bottom: 16 + insets.bottom,
          }]}
        >
          <Text style={{ color: theme.text2, fontSize: 18 }}>↓</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  welcomeContainer: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 48, paddingHorizontal: 16,
  },
  gradientTitleWrap: {
    borderRadius: 12, overflow: 'hidden',
    paddingHorizontal: 12, paddingVertical: 6,
  },
  gradientTitleText: {
    fontSize: 42, fontWeight: '700', letterSpacing: -1,
    color: '#fff', // white text on gradient background
  },
  chip: {
    paddingHorizontal: 22, paddingVertical: 12,
    borderRadius: 999, borderWidth: 1,
  },
  searchSkeleton: {
    borderRadius: 16, borderWidth: 1, padding: 14, marginVertical: 8,
  },
  skeletonLine:   { height: 14, borderRadius: 7 },
  scrollBtn: {
    position: 'absolute', left: '50%', marginLeft: -19,
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
});
