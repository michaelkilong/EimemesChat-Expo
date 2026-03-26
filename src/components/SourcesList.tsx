// SourcesList.tsx — v1.1 (Expo)
// v1.1: forwardRef so citation bubbles [1] can call expand(index) — matches web __expandSource.
import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, ScrollView } from 'react-native';
import { useApp } from '../context/AppContext';
import { IconGlobe, IconChevronDown, IconChevronRight } from '../lib/Icons';
import type { Source } from '../types';

interface Props { sources: Source[]; }

export interface SourcesListHandle {
  expand: (index: number) => void;
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return url; }
}

const SourcesList = forwardRef<SourcesListHandle, Props>(({ sources }, ref) => {
  const { theme } = useApp();
  const [open,     setOpen]     = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  // Exposed to MessageBubble via ref — citation bubble [1] calls this
  useImperativeHandle(ref, () => ({
    expand: (index: number) => {
      setOpen(true);
      setExpanded(index);
    },
  }));

  if (!sources?.length) return null;

  return (
    <View style={{ marginTop: 14 }}>
      {/* Collapsed pill — same design as web */}
      <TouchableOpacity
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.7}
        style={[styles.pill, { backgroundColor: theme.glass2, borderColor: theme.border }]}
      >
        <IconGlobe size={14} color={theme.accent} />
        <Text style={{ color: theme.text2, fontSize: 13, fontWeight: '500' }}>
          {sources.length} {sources.length === 1 ? 'source' : 'sources'}
        </Text>
        <IconChevronDown size={12} color={theme.text3} />
      </TouchableOpacity>

      {/* Expanded card */}
      {open && (
        <View style={[styles.card, { backgroundColor: theme.glass2, borderColor: theme.border }]}>
          {sources.map((src, i) => (
            <View key={i}>
              {/* Source row */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setExpanded(expanded === i ? null : i)}
                style={[
                  styles.sourceRow,
                  { borderBottomColor: theme.borderB, borderBottomWidth: i < sources.length - 1 ? 1 : 0 },
                ]}
              >
                {/* Number badge */}
                <View style={[styles.badge, { backgroundColor: theme.accentDim }]}>
                  <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '700' }}>{i + 1}</Text>
                </View>

                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: theme.accent, fontSize: 13, fontWeight: '500' }} numberOfLines={1}>
                    {src.title}
                  </Text>
                  <Text style={{ color: theme.text3, fontSize: 11, marginTop: 1 }}>
                    {getDomain(src.url)}
                  </Text>
                </View>

                <IconChevronDown size={12} color={theme.text3} />
              </TouchableOpacity>

              {/* Expanded URL + open link */}
              {expanded === i && (
                <View style={[
                  styles.expandedUrl,
                  {
                    backgroundColor: theme.glass3,
                    borderBottomColor: theme.borderB,
                    borderBottomWidth: i < sources.length - 1 ? 1 : 0,
                  },
                ]}>
                  <Text style={{ color: theme.text3, fontSize: 11, lineHeight: 16 }} selectable>
                    {src.url}
                  </Text>
                  <TouchableOpacity
                    onPress={() => Linking.openURL(src.url).catch(() => {})}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}
                  >
                    <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '500' }}>
                      Open link ↗
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

export default SourcesList;

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, alignSelf: 'flex-start',
  },
  card:       { marginTop: 8, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  sourceRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  badge:      { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  expandedUrl:{ paddingHorizontal: 14, paddingLeft: 44, paddingVertical: 10 },
});
