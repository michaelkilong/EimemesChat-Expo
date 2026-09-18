// EimemesChat-Expo/screens/ChatScreen.tsx
// v3.4 — Native sidebar drawer + hamburger + native input + file picker
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  BackHandler,
  Animated,
  Platform,
  Linking,
  KeyboardAvoidingView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import NetInfo from '@react-native-community/netinfo';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';
import Sidebar from '../components/Sidebar';
import { useConversations } from '../hooks/useConversations';

const TARGET_URL = 'https://eimemes-chat-ai.vercel.app';
const GOOGLE_WEB_CLIENT_ID = '230417181657-7v30t8ogq03broga9p676p3f9lltng1a.apps.googleusercontent.com';
const CHROME_UA = 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

const DEFAULT_SHEET_THEME = {
  bg: '#13111a',
  surface: '#211f30',
  text1: '#f1f0f5',
  text3: '#888888',
  border: 'rgba(255,255,255,0.12)',
  accent: '#a78bfa',
};
type SheetTheme = typeof DEFAULT_SHEET_THEME;

WebBrowser.maybeCompleteAuthSession();
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const PRESET_MESSAGES = [
  { title: 'EimemesChat AI', body: "Got a question? I'm here whenever you need me." },
  { title: 'EimemesChat AI', body: "It's been a while — come say hi!" },
  { title: 'EimemesChat AI', body: 'Your AI assistant is ready when you are.' },
  { title: 'EimemesChat AI', body: "Got an idea? Let's talk it through." },
];

async function registerForNotifications(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#a78bfa',
    });
  }
  return true;
}

async function scheduleReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const msg = PRESET_MESSAGES[Math.floor(Math.random() * PRESET_MESSAGES.length)];
  await Notifications.scheduleNotificationAsync({
    content: { title: msg.title, body: msg.body },
    trigger: { hour: 18, minute: 0, repeats: true },
  });
}

function SkeletonBar({ width, height = 14, radius, style }: { width: number | string; height?: number; radius?: number; style?: any }) {
  const pulse = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.85, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View style={[{ width, height, borderRadius: radius ?? height / 2, backgroundColor: '#2a2740', opacity: pulse }, style]} />
  );
}

function SkeletonScreen() {
  return (
    <View style={styles.skeletonScreen}>
      <View style={styles.skeletonTopbar}>
        <SkeletonBar width={36} height={36} radius={18} />
        <SkeletonBar width={130} height={14} />
        <SkeletonBar width={36} height={36} radius={18} />
      </View>
      <View style={styles.skeletonCenter}>
        <SkeletonBar width={210} height={26} style={{ marginBottom: 14 }} />
        <SkeletonBar width={150} height={13} />
      </View>
      <View style={styles.skeletonInputWrap}>
        <SkeletonBar width="100%" height={52} radius={26} />
      </View>
    </View>
  );
}

function SheetRow({ iconComponent, label, onPress, theme, isLast }: {
  iconComponent: React.ReactNode;
  label: string;
  onPress: () => void;
  theme: SheetTheme;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.6}
      style={[sheetStyles.row, { borderBottomColor: theme.border, borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth }]}>
      <View style={sheetStyles.rowIcon}>{iconComponent}</View>
      <Text style={[sheetStyles.rowLabel, { color: theme.text1 }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ChatScreen({ navigation }: any) {
  const webviewRef = useRef<WebView>(null);
  const skipNextLoadingOverlay = useRef(false);

  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const [sheetRendered, setSheetRendered] = useState(false);
  const [sheetTheme, setSheetTheme] = useState<SheetTheme>(DEFAULT_SHEET_THEME);
  const sheetY = useRef(new Animated.Value(400)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const webviewOpacity = useRef(new Animated.Value(0)).current;
  const skeletonOpacity = useRef(new Animated.Value(1)).current;
  const bannerY = useRef(new Animated.Value(-80)).current;

  const [inputText, setInputText] = useState('');
  const [webSearch, setWebSearch] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string; type: string; data: string } | null>(null);
  const [chatTitle, setChatTitle] = useState('EimemesChat');
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const { conversations, deleteConv } = useConversations();

  useEffect(() => {
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
  }, []);

  useEffect(() => {
    NetInfo.fetch().then(state => setIsConnected(state.isConnected ?? false));
    const unsub = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? false;
      setIsConnected(prev => {
        if (!prev && connected && hasLoadedOnce) {
          skipNextLoadingOverlay.current = true;
          setTimeout(() => webviewRef.current?.reload(), 500);
        }
        return connected;
      });
    });
    return () => unsub();
  }, [hasLoadedOnce]);

  useEffect(() => {
    const backAction = () => {
      if (drawerOpen) { setDrawerOpen(false); return true; }
      if (sheetRendered) { hideFilePicker(); return true; }
      if (webviewRef.current) { webviewRef.current.goBack(); return true; }
      return false;
    };
    const handler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => handler.remove();
  }, [sheetRendered, drawerOpen]);

  useEffect(() => {
    if (!loading) {
      Animated.timing(webviewOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      Animated.timing(skeletonOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [loading]);

  useEffect(() => {
    Animated.timing(bannerY, {
      toValue: !isConnected && hasLoadedOnce ? 0 : -80,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isConnected, hasLoadedOnce]);

  useEffect(() => {
    if (!hasLoadedOnce) return;
    const t = setTimeout(async () => {
      const granted = await registerForNotifications();
      if (granted) scheduleReminder();
    }, 3000);
    return () => clearTimeout(t);
  }, [hasLoadedOnce]);

  const notifyWebViewTTSFinished = () => {
    webviewRef.current?.injectJavaScript(`(function() { if (window.__handleNativeTTSFinished) { window.__handleNativeTTSFinished(); } })(); true;`);
  };

  const sendPickedFileToWebView = (base64: string, filename: string, mimeType: string) => {
    setAttachment({
      name: filename,
      type: mimeType.startsWith('image/') ? 'image' : 'other',
      data: `data:${mimeType};base64,${base64}`,
    });
  };

  const showFilePicker = (theme?: Partial<SheetTheme>) => {
    setSheetTheme({
      bg: theme?.bg?.trim() || DEFAULT_SHEET_THEME.bg,
      surface: theme?.surface?.trim() || DEFAULT_SHEET_THEME.surface,
      text1: theme?.text1?.trim() || DEFAULT_SHEET_THEME.text1,
      text3: theme?.text3?.trim() || DEFAULT_SHEET_THEME.text3,
      border: theme?.border?.trim() || DEFAULT_SHEET_THEME.border,
      accent: theme?.accent?.trim() || DEFAULT_SHEET_THEME.accent,
    });
    setSheetRendered(true);
    Animated.parallel([
      Animated.timing(sheetY, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  const hideFilePicker = () => {
    Animated.parallel([
      Animated.timing(sheetY, { toValue: 400, duration: 220, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setSheetRendered(false));
  };

  const pickFromCamera = async () => {
    hideFilePicker();
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.8 });
    if (!result.canceled && result.assets?.[0]?.base64) {
      const asset = result.assets[0];
      sendPickedFileToWebView(asset.base64!, asset.fileName || `photo-${Date.now()}.jpg`, asset.mimeType || 'image/jpeg');
    }
  };

  const pickFromLibrary = async () => {
    hideFilePicker();
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.8 });
    if (!result.canceled && result.assets?.[0]?.base64) {
      const asset = result.assets[0];
      sendPickedFileToWebView(asset.base64!, asset.fileName || `image-${Date.now()}.jpg`, asset.mimeType || 'image/jpeg');
    }
  };

  const pickDocument = async () => {
    hideFilePicker();
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', base64: true } as any);
    if (!result.canceled && (result as any).assets?.[0]?.base64) {
      const asset = (result as any).assets[0];
      sendPickedFileToWebView(asset.base64, asset.name, asset.mimeType || 'application/octet-stream');
    }
  };

  const handleNativeGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      const idToken = (response as any)?.data?.idToken ?? (response as any)?.idToken ?? null;
      if (idToken) {
        webviewRef.current?.injectJavaScript(`
          (function() { if (window.__handleNativeGoogleAuth) { window.__handleNativeGoogleAuth(${JSON.stringify(idToken)}); } })();
          true;
        `);
      }
    } catch (err) {
      if (isErrorWithCode(err)) {
        if (err.code !== statusCodes.SIGN_IN_CANCELLED) console.log('Google Sign-In error', err.code);
      }
    }
  };

  const handleNativeGoogleSignOut = async () => {
    try { await GoogleSignin.signOut(); } catch (err) { console.log('Google native sign-out error', err); }
  };

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'NAVIGATE') { navigation.navigate(data.screen); return; }

      if (data.type === 'STATUS') {
        setIsStreaming(!!data.isStreaming);
        setIsSending(!!data.isSending);
        setDailyLimitReached(!!data.dailyLimitReached);
        if (data.chatTitle) setChatTitle(data.chatTitle);
        if (data.convId !== undefined) setCurrentConvId(data.convId);
        return;
      }

      if (data.type === 'NATIVE_GOOGLE_SIGNIN') handleNativeGoogleSignIn();
      if (data.type === 'NATIVE_GOOGLE_SIGNOUT') handleNativeGoogleSignOut();

      if (data.type === 'NATIVE_TTS_SPEAK' && typeof data.text === 'string' && data.text.trim()) {
        Speech.stop();
        Speech.speak(data.text, {
          language: 'en-US',
          onDone: notifyWebViewTTSFinished,
          onStopped: notifyWebViewTTSFinished,
          onError: notifyWebViewTTSFinished,
        });
      }

      if (data.type === 'NATIVE_TTS_STOP') { Speech.stop(); notifyWebViewTTSFinished(); }
      if (data.type === 'NATIVE_FILE_PICKER') showFilePicker(data.theme);

      if (data.type === 'OPEN_LINK') {
        await WebBrowser.openBrowserAsync(data.url, {
          toolbarColor: '#13111a', controlsColor: '#a78bfa',
          showTitle: true, enableBarCollapsing: true,
        });
      }
    } catch {}
  };

  const openInAppBrowser = async (url: string) => {
    await WebBrowser.openBrowserAsync(url, {
      toolbarColor: '#13111a', controlsColor: '#a78bfa',
      showTitle: true, enableBarCollapsing: true,
    });
  };

  const handleNativeSend = () => {
    if (!inputText.trim() && !attachment) return;
    if (isSending || isStreaming || dailyLimitReached) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const text = inputText.trim();
    const attach = attachment;
    const ws = webSearch;

    setInputText('');
    setAttachment(null);
    setWebSearch(false);

    const attachJson = attach
      ? JSON.stringify({ name: attach.name, type: attach.type, content: attach.data, mimeType: attach.type === 'image' ? 'image/jpeg' : 'application/octet-stream' })
      : 'undefined';

    webviewRef.current?.injectJavaScript(`
      (function() {
        if (window.__nativeSend) {
          window.__nativeSend(${JSON.stringify(text || 'Please analyze this file.')}, ${attachJson}, ${ws});
        }
      })();
      true;
    `);
  };

  const handleNativeStop = () => {
    webviewRef.current?.injectJavaScript(`(function() { if (window.__nativeStop) { window.__nativeStop(); } })(); true;`);
  };

  const handleNewChat = () => {
    webviewRef.current?.injectJavaScript(`(function() { if (window.__nativeNewChat) { window.__nativeNewChat(); } })(); true;`);
  };

  const handleSelectConv = (id: string) => {
    webviewRef.current?.injectJavaScript(`
      (function() { if (window.__nativeSelectConv) {skip window.__nativeSelectConv(${JSON.stringify(id)}); } })();
      true;
    `);
  };

  const handleDeleteConv = (id: string) => {
    deleteConv(id);
    webviewRef.current?.injectJavaScript(`
      (function() { if (window.__nativeDeleteConv) { window.__nativeDeleteConv(${JSON.stringify(id)}); } })();
      true;
    `);
  };

  const handleRetry = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    NetInfo.fetch().then(s => setIsConnected(s.isConnected ?? false));
  };

  if (isConnected === null) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar backgroundColor="#13111a" barStyle="light-content" />
        <SkeletonScreen />
      </SafeAreaView>
    );
  }

  if (!isConnected && !hasLoadedOnce) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar backgroundColor="#13111a" barStyle="light-content" />
        <View style={styles.offlineScreen}>
          <Ionicons name="cloud-offline-outline" size={64} color={Colors.text3} style={{ marginBottom: 20 }} />
          <Text style={styles.offlineTitle}>No Connection</Text>
          <Text style={styles.offlineSub}>
            EimemesChat needs internet for first launch.{'\n'}Check your Wi-Fi or mobile data.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.8}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const canSend = (inputText.trim().length > 0 || attachment !== null) && !isSending && !isStreaming && !dailyLimitReached;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor="#13111a" barStyle="light-content" />

      <Animated.View style={[styles.offlineBanner, { transform: [{ translateY: bannerY }] }]}>
        <Text style={styles.offlineBannerText}>No internet connection</Text>
      </Animated.View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1 }}>
          {/* Native header with hamburger */}
          {!loading && (
            <View style={nativeInputStyles.header}>
              <TouchableOpacity onPress={() => setDrawerOpen(true)}>
                <Ionicons name="menu" size={24} color={Colors.text1} />
              </TouchableOpacity>
              <Text style={nativeInputStyles.headerTitle} numberOfLines={1}>{chatTitle}</Text>
              <TouchableOpacity onPress={handleNewChat}>
                <Ionicons name="add" size={24} color={Colors.text1} />
              </TouchableOpacity>
            </View>
          )}

          {loading && (
            <Animated.View style={[styles.skeletonOverlay, { opacity: skeletonOpacity }]}>
              <SkeletonScreen />
            </Animated.View>
          )}

          <Animated.View style={{ flex: 1, opacity: webviewOpacity }}>
            <WebView
              ref={webviewRef}
              source={{ uri: TARGET_URL }}
              userAgent={CHROME_UA}
              originWhitelist={['*']}
              mixedContentMode="always"
              thirdPartyCookiesEnabled
              onMessage={handleMessage}
              onOpenWindow={event => openInAppBrowser(event.nativeEvent.targetUrl)}
              injectedJavaScript={`
                (function() {
                  const meta = document.createElement('meta');
                  meta.setAttribute('name', 'viewport');
                  meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
                  document.getElementsByTagName('head')[0].appendChild(meta);
                  const style = document.createElement('style');
                  style.textContent = \`
                    html, body { background-color: #13111a !important; }
                    * { -webkit-user-select: none !important; user-select: none !important; -webkit-touch-callout: none !important; }
                    input, textarea, [contenteditable] { -webkit-user-select: text !important; user-select: text !important; }
                  \`;
                  document.head.appendChild(style);
                })();
                true;
              `}
              onShouldStartLoadWithRequest={request => {
                const { url } = request;
                if (url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('sms:')) {
                  Linking.openURL(url).catch(() => {});
                  return false;
                }
                if (url.startsWith('https://eimemes-chat-ai.vercel.app') || url.includes('firebaseapp.com')) return true;
                if (url.startsWith('http://') || url.startsWith('https://')) { openInAppBrowser(url); return false; }
                return true;
              }}
              onLoadStart={() => { if (!NextLoadingOverlay.current) setLoading(true); }}
              onLoadEnd={() => { setLoading(false); setHasLoadedOnce(true); skipNextLoadingOverlay.current = false; }}
              onError={() => { setLoading(false); skipNextLoadingOverlay.current = false; }}
              javaScriptEnabled
              domStorageEnabled
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              mediaCapturePermissionGrantType="grant"
              style={{ flex: 1, backgroundColor: '#13111a' }}
            />
          </Animated.View>

          {/* Native input bar */}
          {!dailyLimitReached && (
            <View style={nativeInputStyles.container}>
              {attachment && (
                <View style={nativeInputStyles.attachmentPreview}>
                  <Ionicons name={attachment.type === 'image' ? 'image-outline' : 'document-outline'} size={16} color={Colors.accent} />
                  <Text style={nativeInputStyles.attachmentName} numberOfLines={1}>{attachment.name}</Text>
                  <TouchableOpacity onPress={() => setAttachment(null)}>
                    <Ionicons name="close-circle" size={18} color={Colors.text3} />
                  </TouchableOpacity>
                </View>
              )}
              <View style={nativeInputStyles.inputWrapper}>
                <TextInput
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Message Eimemes…"
                  placeholderTextColor={Colors.text3}
                  multiline
                  style={nativeInputStyles.textInput}
                />
                <View style={nativeInputStyles.toolbar}>
                  <TouchableOpacity
                    onPress={() => setWebSearch(!webSearch)}
                    style={[nativeInputStyles.searchBtn, webSearch && nativeInputStyles.searchBtnActive]}
                  >
                    <Ionicons name="globe-outline" size={16} color={webSearch ? '#0a84ff' : Colors.text2} />
                    <Text style={[nativeInputStyles.searchText, webSearch && { color: '#0a84ff' }]}>Search</Text>
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity onPress={() => showFilePicker()} style={nativeInputStyles.circleBtn}>
                      <Ionicons name="add" size={18} color={attachment ? '#0a84ff' : Colors.text2} />
                    </TouchableOpacity>

                    {isStreaming ? (
                      <TouchableOpacity onPress={handleNativeStop} style={nativeInputStyles.stopBtn}>
                        <Ionicons name="stop" size={16} color="white" />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={handleNativeSend}
                        disabled={!canSend}
                        style={[nativeInputStyles.sendBtn, canSend && nativeInputStyles.sendBtnActive]}
                      >
                        <Ionicons name="arrow-up" size={18} color={canSend ? 'white' : Colors.text3} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Native Sidebar */}
      <Sidebar
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        conversations={conversations}
        currentConvId={currentConvId}
        onSelectConv={handleSelectConv}
        onNewChat={handleNewChat}
        onOpenSettings={() => navigation.navigate('Settings')}
        onDeleteConv={handleDeleteConv}
        dailyCount={0}
        dailyLimit={100}
      />

      {/* File picker sheet */}
      {sheetRendered && (
        <>
          <Animated.View style={[sheetStyles.backdrop, { opacity: backdropOpacity }]}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={hideFilePicker} />
          </Animated.View>

          <Animated.View style={[sheetStyles.sheet, { backgroundColor: sheetTheme.surface, transform: [{ translateY: sheetY }] }]}>
            <View style={[sheetStyles.handle, { backgroundColor: sheetTheme.border }]} />
            <Text style={[sheetStyles.title, { color: sheetTheme.text3 }]}>Add attachment</Text>
            <View style={{ borderRadius: 14, overflow: 'hidden', backgroundColor: sheetTheme.bg }}>
              <SheetRow iconComponent={<Ionicons name="camera-outline" size={20} color={sheetTheme.text1} />} label="Take Photo" onPress={pickFromCamera} theme={sheetTheme} />
              <SheetRow iconComponent={<Ionicons name="image-outline" size={20} color={sheetTheme.text1} />} label="Choose Photo" onPress={pickFromLibrary} theme={sheetTheme} />
              <SheetRow iconComponent={<Ionicons name="document-outline" size={20} color={sheetTheme.text1} />} label="Choose File" onPress={pickDocument} theme={sheetTheme} isLast />
            </View>
            <TouchableOpacity onPress={hideFilePicker} activeOpacity={0.7} style={[sheetStyles.cancelBtn, { backgroundColor: sheetTheme.bg }]}>
              <Text style={[sheetStyles.cancelText, { color: sheetTheme.accent }]}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#13111a' },
  offlineScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#13111a', padding: 32 },
  offlineTitle: { fontSize: 22, fontWeight: '700', color: '#f1f0f5', marginBottom: 10 },
  offlineSub: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 36 },
  retryBtn: { backgroundColor: '#7c3aed', paddingHorizontal: 36, paddingVertical: 13, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  offlineBanner: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
    backgroundColor: '#7f1d1d', paddingVertical: 9, alignItems: 'center',
  },
  offlineBannerText: { color: '#fecaca', fontSize: 13, fontWeight: '600' },
  skeletonOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#13111a', zIndex: 10 },
  skeletonScreen: { flex: 1, backgroundColor: '#13111a', paddingTop: 16, paddingHorizontal: 16 },
  skeletonTopbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 60 },
  skeletonCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  skeletonInputWrap: { paddingBottom: 24 },
});

const nativeInputStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 12,
    backgroundColor: Colors.bgA,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderB,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.text1, maxWidth: '70%' },
  container: { paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8, backgroundColor: 'transparent' },
  attachmentPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: Colors.glass2, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: 8,
  },
  attachmentName: { flex: 1, fontSize: 13, color: Colors.text1 },
  inputWrapper: {
    backgroundColor: Colors.glass1, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
    padding: 14, minHeight: 100,
    justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 8,
  },
  textInput: {
    fontSize: 15.5, color: Colors.text1, lineHeight: 22,
    minHeight: 26, maxHeight: 120, padding: 0, marginBottom: 12,
  },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  searchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    height: 30, paddingHorizontal: 12, borderRadius: 15,
    backgroundColor: Colors.glass3, borderWidth: 1, borderColor: Colors.border,
  },
  searchBtnActive: { backgroundColor: 'rgba(10,132,255,0.18)', borderColor: 'rgba(10,132,255,0.5)' },
  searchText: { fontSize: 12.5, fontWeight: '500', color: Colors.text2 },
  circleBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.glass3, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.glass3, alignItems: 'center', justifyContent: 'center' },
  sendBtnActive: {
    backgroundColor: '#0a84ff', shadowColor: '#0a84ff',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
  },
  stopBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#ff3b3b',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#ff3b3b', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 4,
  },
});

const sheetStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 50,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 32,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  title: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14 },
  rowIcon: { width: 24, marginRight: 14, alignItems: 'center' },
  rowLabel: { fontSize: 16, fontWeight: '500' },
  cancelBtn: { marginTop: 12, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  cancelText: { fontSize: 16, fontWeight: '600' },
});