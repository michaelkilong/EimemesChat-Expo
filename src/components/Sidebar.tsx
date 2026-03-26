// Sidebar.tsx — v1.0 (Expo)
import React, { useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, Animated, Pressable, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import { haptic } from '../lib/haptic';
import type { Conversation } from '../types';

const SIDEBAR_W = 260;

interface Props {
  conversations: Conversation[];
  currentConvId: string | null;
  onNewChat: () => void;
  onSelectConv: (id: string) => void;
  onOpenSettings: () => void;
  onDeleteConv: (id: string) => void;
}

export default function Sidebar({
  conversations, currentConvId, onNewChat, onSelectConv, onOpenSettings, onDeleteConv,
}: Props) {
  const { theme, sidebarOpen, setSidebarOpen, showConfirm } = useApp();
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(-SIDEBAR_W)).current;

  // Animate open/close
  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: sidebarOpen ? 0 : -SIDEBAR_W,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [sidebarOpen]);

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const startPress = useCallback((convId: string, title: string) => {
    didLongPress.current = false;
    pressTimer.current = setTimeout(async () => {
      didLongPress.current = true;
      haptic.heavy();
      const yes = await showConfirm(
        `"${(title || 'This conversation').slice(0, 40)}" will be permanently deleted.`,
        'Delete',
        'Delete conversation?',
      );
      if (yes) { haptic.heavy(); onDeleteConv(convId); }
    }, 500);
  }, [showConfirm, onDeleteConv]);

  const endPress = useCallback(() => {
    if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; }
  }, []);

  const handlePress = useCallback((convId: string) => {
    if (didLongPress.current) { didLongPress.current = false; return; }
    onSelectConv(convId);
    setSidebarOpen(false);
  }, [onSelectConv, setSidebarOpen]);

  if (!sidebarOpen) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Backdrop */}
      <Pressable
        style={[StyleSheet.absoluteFillObject, styles.backdrop]}
        onPress={() => setSidebarOpen(false)}
      />

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          { backgroundColor: theme.bgA, borderRightColor: theme.border, transform: [{ translateX }] },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, {
          paddingTop: insets.top + 18,
          borderBottomColor: theme.borderB,
        }]}>
          <LinearGradient
            colors={['#5e9cff', '#c96eff']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ borderRadius: 6, paddingHorizontal: 2 }}
          >
            <Text style={styles.brandText}>✦ EimemesChat AI</Text>
          </LinearGradient>

          <TouchableOpacity
            onPress={() => setSidebarOpen(false)}
            activeOpacity={0.7}
            style={[styles.closeBtn, { backgroundColor: theme.glass3, borderColor: theme.borderB }]}
          >
            <Text style={{ color: theme.text2, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* New chat button */}
        <TouchableOpacity
          onPress={onNewChat}
          activeOpacity={0.7}
          style={[styles.newChatBtn, { backgroundColor: theme.glass3, borderColor: theme.border }]}
        >
          <Text style={{ color: theme.accent, fontSize: 16 }}>＋</Text>
          <Text style={{ color: theme.text2, fontSize: 14.5, fontWeight: '500' }}>New chat</Text>
        </TouchableOpacity>

        {/* Hint */}
        <Text style={[styles.hint, { color: theme.text3 }]}>Hold to delete a conversation</Text>

        {/* Recents label */}
        <Text style={[styles.sectionLabel, { color: theme.text3 }]}>RECENTS</Text>

        {/* Conversation list */}
        <FlatList
          data={conversations}
          keyExtractor={c => c.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={{ color: theme.text3, fontSize: 13, paddingHorizontal: 12, paddingVertical: 8 }}>
              No conversations yet
            </Text>
          }
          renderItem={({ item: conv }) => (
            <Pressable
              onPress={() => handlePress(conv.id)}
              onLongPress={() => { haptic.heavy(); startPress(conv.id, conv.title); }}
              onPressOut={endPress}
              style={[
                styles.convItem,
                conv.id === currentConvId && { backgroundColor: theme.accentDim },
              ]}
            >
              <Text
                numberOfLines={1}
                style={{
                  color: conv.id === currentConvId ? theme.accent : theme.text2,
                  fontWeight: conv.id === currentConvId ? '500' : '400',
                  fontSize: 14.5,
                }}
              >
                {conv.title || 'New conversation'}
              </Text>
            </Pressable>
          )}
        />

        {/* Settings footer */}
        <View style={[styles.footer, { borderTopColor: theme.borderB, paddingBottom: insets.bottom + 10 }]}>
          <TouchableOpacity
            onPress={onOpenSettings}
            activeOpacity={0.7}
            style={[styles.settingsBtn, { backgroundColor: theme.glass3 }]}
          >
            <Text style={{ color: theme.accent, fontSize: 16 }}>⚙️</Text>
            <Text style={{ color: theme.text2, fontSize: 14.5 }}>Settings</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.55)' },
  drawer: {
    position: 'absolute', top: 0, left: 0, bottom: 0,
    width: SIDEBAR_W,
    borderRightWidth: 1,
    zIndex: 30,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: 1,
  },
  brandText: {
    fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: -0.3,
  },
  closeBtn: {
    width: 34, height: 34, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  newChatBtn: {
    margin: 12, marginTop: 12, marginBottom: 0,
    padding: 11, paddingHorizontal: 14,
    borderRadius: 14, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  hint: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 2, fontSize: 11, fontStyle: 'italic' },
  sectionLabel: {
    paddingHorizontal: 18, paddingVertical: 4,
    fontSize: 10.5, fontWeight: '600', letterSpacing: 0.7,
  },
  convItem: {
    paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: 10,
  },
  footer:      { borderTopWidth: 1, padding: 10 },
  settingsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 11, paddingHorizontal: 12, borderRadius: 14,
  },
});
