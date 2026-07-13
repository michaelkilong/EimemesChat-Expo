// App.tsx
// EimemesChat AI — WebView Wrapper
// v2.1 — Downgraded google-signin to ^13.0.0 (known prebuild bug on 14+), defensive idToken extraction
// v2.0 — Native Google Sign-In (replaces broken browser-redirect approach)
// v1.9 — Local push notifications (preset rotating reminder messages)
// v1.8 — softwareKeyboardLayoutMode: resize; locked dark bg to prevent flash
// v1.7 — Facebook-Lite skeleton loading + persistent UI with offline banner

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  BackHandler,
  Animated,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import NetInfo from '@react-native-community/netinfo';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';

const TARGET_URL = 'https://eimemes-chat-ai.vercel.app';
const GOOGLE_WEB_CLIENT_ID = '230417181657-7v30t8ogq03broga9p676p3f9lltng1a.apps.googleusercontent.com';

const CHROME_UA =
  'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

WebBrowser.maybeCompleteAuthSession();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const PRESET_MESSAGES = [
  { title: '💬 EimemesChat AI', body: "Got a question? I'm here whenever you need me." },
  { title: '✨ EimemesChat AI', body: "It's been a while — come say hi!" },
  { title: '🤖 EimemesChat AI', body: 'Your AI assistant is ready when you are.' },
  { title: '💡 EimemesChat AI', body: "Got an idea? Let's talk it through." },
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

function SkeletonBar({
  width, height = 14, radius, style,
}: { width: number | string; height?: number; radius?: number; style?: any }) {
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
    <Animated.View
      style={[
        { width, height, borderRadius: radius ?? height / 2, backgroundColor: '#2a2740', opacity: pulse },
        style,
      ]}
    />
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

export default function App() {
  const webviewRef = useRef<WebView>(null);
  const skipNextLoadingOverlay = useRef(false);

  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const webviewOpacity = useRef(new Animated.Value(0)).current;
  const skeletonOpacity = useRef(new Animated.Value(1)).current;
  const bannerY = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
    });
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
      if (webviewRef.current) {
        webviewRef.current.goBack();
        return true;
      }
      return false;
    };
    const handler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => handler.remove();
  }, []);

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

  const handleNativeGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      // Handle both response shapes across package versions
      const idToken = (response as any)?.data?.idToken ?? (response as any)?.idToken ?? null;

      if (idToken) {
        const script = `
          (function() {
            if (window.__handleNativeGoogleAuth) {
              window.__handleNativeGoogleAuth(${JSON.stringify(idToken)});
            }
          })();
          true;
        `;
        webviewRef.current?.injectJavaScript(script);
      }
    } catch (err) {
      if (isErrorWithCode(err)) {
        if (err.code === statusCodes.SIGN_IN_CANCELLED) {
          // user backed out of the picker — do nothing
        } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          console.log('Google Play Services not available');
        } else {
          console.log('Google Sign-In error', err.code);
        }
      }
    }
  };

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'NATIVE_GOOGLE_SIGNIN') {
        handleNativeGoogleSignIn();
      }

      if (data.type === 'OPEN_LINK') {
        await WebBrowser.openBrowserAsync(data.url, {
          toolbarColor: '#13111a',
          controlsColor: '#a78bfa',
          showTitle: true,
          enableBarCollapsing: true,
        });
      }
    } catch { /* ignore non-JSON messages */ }
  };

  const openInAppBrowser = async (url: string) => {
    await WebBrowser.openBrowserAsync(url, {
      toolbarColor: '#13111a',
      controlsColor: '#a78bfa',
      showTitle: true,
      enableBarCollapsing: true,
    });
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
          <Text style={styles.offlineIcon}>📡</Text>
          <Text style={styles.offlineTitle}>No Connection</Text>
          <Text style={styles.offlineSub}>
            EimemesChat needs internet for first launch.{'\n'}
            Check your Wi-Fi or mobile data.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.8}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor="#13111a" barStyle="light-content" />

      <Animated.View style={[styles.offlineBanner, { transform: [{ translateY: bannerY }] }]}>
        <Text style={styles.offlineBannerText}>⚠️  No internet connection</Text>
      </Animated.View>

      <View style={{ flex: 1 }}>
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
                  html, body {
                    background-color: #13111a !important;
                  }
                  * {
                    -webkit-user-select: none !important;
                    user-select: none !important;
                    -webkit-touch-callout: none !important;
                  }
                  input, textarea, [contenteditable] {
                    -webkit-user-select: text !important;
                    user-select: text !important;
                  }
                \`;
                document.head.appendChild(style);
              })();
              true;
            `}
            onShouldStartLoadWithRequest={request => {
              const { url } = request;
              if (
                url.startsWith('https://eimemes-chat-ai.vercel.app') ||
                url.includes('firebaseapp.com')
              ) {
                return true;
              }
              if (url.startsWith('http://') || url.startsWith('https://')) {
                openInAppBrowser(url);
                return false;
              }
              return true;
            }}
            onLoadStart={() => {
              if (!skipNextLoadingOverlay.current) {
                setLoading(true);
              }
            }}
            onLoadEnd={() => {
              setLoading(false);
              setHasLoadedOnce(true);
              skipNextLoadingOverlay.current = false;
            }}
            onError={() => {
              setLoading(false);
              skipNextLoadingOverlay.current = false;
            }}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            mediaCapturePermissionGrantType="grant"
            style={{ flex: 1, backgroundColor: '#13111a' }}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#13111a' },
  offlineScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#13111a', padding: 32 },
  offlineIcon: { fontSize: 64, marginBottom: 20 },
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