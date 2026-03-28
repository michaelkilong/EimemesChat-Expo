// App.tsx — v1.2 (Expo)
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StatusBar,
  StyleSheet, Modal, Animated, BackHandler, Alert,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppProvider, useApp } from './src/context/AppContext';
import { useAuth }              from './src/hooks/useAuth';
import { useTheme }             from './src/hooks/useTheme';
import { useConversations }     from './src/hooks/useConversations';
import { useMessages }          from './src/hooks/useMessages';
import { useChat }              from './src/hooks/useChat';
import { db }                   from './src/firebase';
import { DAILY_LIMIT }          from './src/constants';

import Sidebar             from './src/components/Sidebar';
import MessageList         from './src/components/MessageList';
import InputArea           from './src/components/InputArea';
import SettingsView        from './src/components/SettingsView';
import ProfileView         from './src/components/ProfileView';
import PersonalizationView from './src/components/PersonalizationView';
import AboutView           from './src/components/AboutView';
import LicensesView        from './src/components/LicensesView';
import LoginModal          from './src/components/modals/LoginModal';
import { IconMenu, IconPlus } from './src/lib/Icons';

import type { Attachment, View as ViewType } from './src/types';

// ── Global error handler — shows crash details before app closes ──
const originalHandler = (global as any).ErrorUtils?.getGlobalHandler?.();
(global as any).ErrorUtils?.setGlobalHandler?.((error: any, isFatal: boolean) => {
  Alert.alert(
    'Crash Report',
    error.message + '\n\n' + (error.stack?.slice(0, 300) ?? ''),
  );
  originalHandler?.(error, isFatal);
});

function todayStr() { return new Date().toISOString().slice(0, 10); }

function CircleBtn({ onPress, children }: { onPress: () => void; children: React.ReactNode }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.circleBtn, {
        backgroundColor: 'rgba(255,255,255,0.22)',
        borderColor: 'rgba(255,255,255,0.35)',
      }]}
    >
      {children}
    </TouchableOpacity>
  );
}

function Toast() {
  const { toastMsg, toastVisible, theme } = useApp();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: toastVisible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [toastVisible]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.toast, { backgroundColor: theme.bgA, borderColor: theme.border, opacity }]}
    >
      <Text style={{ color: theme.text1, fontSize: 14, textAlign: 'center' }}>{toastMsg}</Text>
    </Animated.View>
  );
}

function ConfirmDialog() {
  const { theme, confirmState, handleConfirmYes, handleConfirmNo } = useApp();
  return (
    <Modal visible={confirmState.open} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.confirmOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={handleConfirmNo} activeOpacity={1} />
        <View style={[styles.confirmCard, { backgroundColor: theme.bgA, borderColor: theme.border }]}>
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text1, marginBottom: 8 }}>
              {confirmState.title}
            </Text>
            <Text style={{ fontSize: 14, color: theme.text2, lineHeight: 21, textAlign: 'center' }}>
              {confirmState.msg}
            </Text>
          </View>
          <View style={{ height: 1, backgroundColor: theme.borderB }} />
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={handleConfirmNo}  style={styles.confirmBtn}>
              <Text style={{ color: theme.text2, fontSize: 15, fontWeight: '500' }}>Cancel</Text>
            </TouchableOpacity>
            <View style={{ width: 1, backgroundColor: theme.borderB }} />
            <TouchableOpacity onPress={handleConfirmYes} style={styles.confirmBtn}>
              <Text style={{ color: '#ff6b6b', fontSize: 15, fontWeight: '700' }}>
                {confirmState.yesLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function AppInner() {
  useAuth();
  useTheme();

  const {
    currentUser, authReady, view, setView,
    theme, sidebarOpen, setSidebarOpen,
  } = useApp();
  const insets = useSafeAreaInsets();

  const [currentConvId,     setCurrentConvId]     = useState<string | null>(null);
  const [chipsUsed,         setChipsUsed]         = useState(false);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);

  useEffect(() => {
    const onBack = (): boolean => {
      if (sidebarOpen) { setSidebarOpen(false); return true; }
      if (view === 'licenses')        { setView('about');     return true; }
      if (view === 'about')           { setView('settings');  return true; }
      if (view === 'personalization') { setView('settings');  return true; }
      if (view === 'profile')         { setView('settings');  return true; }
      if (view === 'settings')        { setView('chat');      return true; }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [view, sidebarOpen, setSidebarOpen, setView]);

  useEffect(() => {
    AsyncStorage.getItem('ec_chips_used')
      .then(v => { if (v === 'true') setChipsUsed(true); })
      .catch(() => {});
  }, []);

  const {
    conversations, createNewChat, clearAllChats,
    deleteConv, getConvRef, getUserConvsRef,
  } = useConversations();

  const { messages, setMessages, convTitle, setConvTitle, isStreamingRef } = useMessages(currentConvId);

  const handleNewChat = useCallback(async () => {
    const id = await createNewChat();
    if (id) { setCurrentConvId(id); setView('chat'); }
  }, [createNewChat, setView]);

  const {
    isSending, isStreaming, isTyping, isSearching,
    streamText, streamDone, streamModel, streamDisclaimer, streamSources,
    sendMessage, stopStreaming,
  } = useChat(
    currentConvId, setCurrentConvId,
    conversations, createNewChat,
    setConvTitle, isStreamingRef, setMessages,
  );

  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, 'users', currentUser.uid))
      .then(snap => {
        if (!snap.exists()) return;
        const data = snap.data() as { dailyCount?: number; lastDate?: string };
        if (data.lastDate === todayStr() && (data.dailyCount || 0) >= DAILY_LIMIT) {
          setDailyLimitReached(true);
        }
      })
      .catch(() => {});
  }, [currentUser]);

  const handleSend = useCallback((text: string, attachment?: Attachment, useWebSearch?: boolean) => {
    sendMessage(text, () => {
      setChipsUsed(true);
      AsyncStorage.setItem('ec_chips_used', 'true').catch(() => {});
    }, attachment, useWebSearch);
  }, [sendMessage]);

  const handleRegen = useCallback(async (originalMsg: string) => {
    if (!currentConvId || isSending || isStreaming) return;
    const { getDoc: gd, updateDoc } = await import('firebase/firestore');
    const convRef = getConvRef(currentConvId);
    if (!convRef) return;
    const snap = await gd(convRef);
    if (!snap.exists()) return;
    const msgs    = snap.data().messages || [];
    const trimmed = [...msgs];
    while (trimmed.length && trimmed[trimmed.length - 1].role === 'assistant') trimmed.pop();
    await updateDoc(convRef, { messages: trimmed, updatedAt: new Date() });
    handleSend(originalMsg);
  }, [currentConvId, isSending, isStreaming, getConvRef, handleSend]);

  const handleDeleteConv = useCallback(async (id: string) => {
    await deleteConv(id);
    if (currentConvId === id) setCurrentConvId(null);
  }, [deleteConv, currentConvId]);

  const handleClearChats = useCallback(async () => {
    await clearAllChats();
    setCurrentConvId(null);
  }, [clearAllChats]);

  const topbarTitle = currentConvId
    ? (convTitle || conversations.find(c => c.id === currentConvId)?.title || 'EimemesChat')
    : '';

  if (!authReady) {
    return <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#0d0d0d' }]} />;
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <Sidebar
        conversations={conversations}
        currentConvId={currentConvId}
        onNewChat={handleNewChat}
        onSelectConv={id => { setCurrentConvId(id); setView('chat'); }}
        onOpenSettings={() => { setView('settings'); setSidebarOpen(false); }}
        onDeleteConv={handleDeleteConv}
      />

      {view === 'chat' && (
        <>
          <View style={[styles.topbar, { paddingTop: insets.top + 10 }]}>
            <LinearGradient
              colors={[theme.bg, theme.bg + 'cc', 'transparent']}
              style={[StyleSheet.absoluteFillObject, { zIndex: 0 }]}
            />
            <View style={[styles.topbarRow, { zIndex: 1 }]}>
              <CircleBtn onPress={() => setSidebarOpen(true)}>
                <IconMenu size={18} color={theme.text1} />
              </CircleBtn>
              <Text numberOfLines={1} style={[styles.topbarTitle, { color: theme.text1 }]}>
                {topbarTitle}
              </Text>
              <CircleBtn onPress={handleNewChat}>
                <IconPlus size={18} color={theme.text1} />
              </CircleBtn>
            </View>
          </View>

          <MessageList
            messages={messages}
            isTyping={isTyping}
            isSearching={isSearching}
            isStreaming={isStreaming}
            streamText={streamText}
            streamDone={streamDone}
            streamModel={streamModel}
            streamDisclaimer={streamDisclaimer}
            streamSources={streamSources}
            convId={currentConvId}
            chipsUsed={chipsUsed}
            onChipClick={handleSend}
            onRegen={handleRegen}
          />

          <InputArea
            onSend={handleSend}
            onStop={stopStreaming}
            isSending={isSending}
            isStreaming={isStreaming}
            dailyLimitReached={dailyLimitReached}
          />
        </>
      )}

      {view === 'settings' && (
        <SettingsView
          onBack={() => setView('chat')}
          onOpenProfile={() => setView('profile')}
          onOpenPersonalization={() => setView('personalization')}
          onOpenAbout={() => setView('about')}
          onClearChats={handleClearChats}
          conversations={conversations}
        />
      )}
      {view === 'profile' && (
        <ProfileView onBack={() => setView('settings')} getUserConvsRef={getUserConvsRef} />
      )}
      {view === 'personalization' && (
        <PersonalizationView onBack={() => setView('settings')} />
      )}
      {view === 'about' && (
        <AboutView onBack={() => setView('settings')} onOpenLicenses={() => setView('licenses')} />
      )}
      {view === 'licenses' && (
        <LicensesView onBack={() => setView('about')} />
      )}

      <LoginModal visible={!currentUser} />
      <Toast />
      <ConfirmDialog />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppInner />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topbar: {
    flexShrink: 0,
    paddingBottom: 10,
    zIndex: 10,
  },
  topbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  topbarTitle: {
    fontSize: 16, fontWeight: '600',
    position: 'absolute', left: 68, right: 68,
    textAlign: 'center',
  },
  circleBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 1,
  },
  toast: {
    position: 'absolute', bottom: 80,
    left: '12%', right: '12%',
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1,
    alignItems: 'center', zIndex: 999,
    shadowColor: '#000', shadowOpacity: 0.2,
    shadowRadius: 8, elevation: 8,
  },
  confirmOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center', padding: 40,
  },
  confirmCard: {
    width: '100%', maxWidth: 320,
    borderRadius: 20, overflow: 'hidden', borderWidth: 1,
  },
  confirmBtn: { flex: 1, padding: 15, alignItems: 'center' },
});
