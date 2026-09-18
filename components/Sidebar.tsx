// EimemesChat-Expo/components/Sidebar.tsx
import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Animated, Dimensions, Pressable, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';
import type { Conversation } from '../hooks/useConversations';

const DRAWER_WIDTH = Math.min(320, Dimensions.get('window').width * 0.82);

interface Props {
  visible: boolean;
  onClose: () => void;
  conversations: Conversation[];
  currentConvId: string | null;
  onSelectConv: (id: string) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onDeleteConv: (id: string) => void;
  dailyCount?: number;
  dailyLimit?: number;
}

function getRelativeDateLabel(date: any): string {
  if (!date) return 'Earlier';
  let jsDate: Date;
  if (date instanceof Date) jsDate = date;
  else if (typeof date === 'object' && 'seconds' in date) jsDate = new Date(date.seconds * 1000);
  else if (typeof date === 'string') jsDate = new Date(date);
  else return 'Earlier';

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const thirtyDaysAgo = new Date(todayStart.getTime() - 30 * 86400000);

  if (jsDate >= todayStart) return 'Today';
  if (jsDate >= yesterdayStart) return 'Yesterday';
  if (jsDate >= thirtyDaysAgo) return 'Last 30 Days';
  return 'Earlier';
}

export default function Sidebar({
  visible, onClose, conversations, currentConvId,
  onSelectConv, onNewChat, onOpenSettings, onDeleteConv,
  dailyCount = 0, dailyLimit = 100,
}: Props) {
  const slideX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const [search, setSearch] = useState('');
  const [rendered, setRendered] = useState(visible);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.timing(slideX, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(backdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideX, { toValue: -DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
        Animated.timing(backdrop, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setRendered(false));
    }
  }, [visible]);

  const grouped = useMemo(() => {
    const filtered = search
      ? conversations.filter(c => (c.title || '').toLowerCase().includes(search.toLowerCase()))
      : conversations;

    if (search) return { Results: filtered } as Record<string, Conversation[]>;

    const groups: Record<string, Conversation[]> = {
      'Today': [], 'Yesterday': [], 'Last 30 Days': [], 'Earlier': [],
    };

    const sorted = [...filtered].sort((a, b) => {
      const at = (a.updatedAt as any)?.seconds || 0;
      const bt = (b.updatedAt as any)?.seconds || 0;
      return bt - at;
    });

    for (const c of sorted) {
      const label = getRelativeDateLabel(c.updatedAt);
      (groups[label] || groups['Earlier']).push(c);
    }

    return Object.fromEntries(
      Object.entries(groups).filter(([, v]) => v.length > 0)
    );
  }, [conversations, search]);

  if (!rendered) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideX }] }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>✦ EimemesChat AI</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={18} color={Colors.text2} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={14} color={Colors.text3} style={{ marginRight: 8 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search conversations..."
            placeholderTextColor={Colors.text3}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.text3} />
            </TouchableOpacity>
          )}
        </View>

        {/* New chat */}
        <TouchableOpacity style={styles.newChatBtn} onPress={() => { onNewChat(); onClose(); }}>
          <Ionicons name="add" size={18} color={Colors.accent} />
          <Text style={styles.newChatText}>New chat</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>Hold to delete a conversation</Text>

        {/* List */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 8 }}>
          {Object.entries(grouped).map(([section, items]) => (
            <View key={section} style={{ marginBottom: 6 }}>
              <Text style={styles.sectionLabel}>{section}</Text>
              {items.map(conv => (
                <TouchableOpacity
                  key={conv.id}
                  onPress={() => { onSelectConv(conv.id); onClose(); }}
                  onLongPress={() => {
                    Alert.alert(
                      'Delete conversation?',
                      `"${(conv.title || 'New conversation').slice(0, 40)}" will be permanently deleted.`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => onDeleteConv(conv.id) },
                      ]
                    );
                  }}
                  style={[
                    styles.convRow,
                    conv.id === currentConvId && styles.convRowActive,
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.convText,
                      conv.id === currentConvId && { color: Colors.accent },
                    ]}
                  >
                    {conv.title || 'New conversation'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
          {conversations.length === 0 && (
            <Text style={styles.empty}>No conversations yet</Text>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.usageRow}>
            <Text style={styles.usageLabel}>Today's usage</Text>
            <Text style={styles.usageValue}>{dailyCount}/{dailyLimit}</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => { onOpenSettings(); onClose(); }}>
            <Ionicons name="settings-outline" size={16} color={Colors.accent} />
            <Text style={styles.settingsText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  drawer: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: Colors.bgA,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderB,
  },
  logo: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: Colors.glass3,
    alignItems: 'center', justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.glass2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderB,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.text1,
    padding: 0,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.accentDim,
    borderRadius: 12,
  },
  newChatText: { fontSize: 14, fontWeight: '600', color: Colors.accent },
  hint: {
    fontSize: 11,
    color: Colors.text3,
    fontStyle: 'italic',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 2,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: Colors.text3,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
  },
  convRow: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  convRowActive: {
    backgroundColor: Colors.accentDim,
  },
  convText: {
    fontSize: 14.5,
    fontWeight: '500',
    color: Colors.text1,
  },
  empty: {
    textAlign: 'center',
    color: Colors.text3,
    fontSize: 13,
    paddingTop: 20,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderB,
    padding: 10,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  usageLabel: { fontSize: 12, color: Colors.text3 },
  usageValue: { fontSize: 12, fontWeight: '600', color: Colors.text2 },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: Colors.glass2,
    borderWidth: 1,
    borderColor: Colors.borderB,
  },
  settingsText: { fontSize: 14.5, fontWeight: '500', color: Colors.text2 },
});