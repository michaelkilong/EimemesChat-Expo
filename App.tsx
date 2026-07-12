// App.tsx
// EimemesChat AI — WebView Wrapper
// v1.6 — Premium polish: typing animation, fade transitions, haptics

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  SafeAreaView,
  BackHandler,
  Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import NetInfo from '@react-native-community/netinfo';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';

const TARGET_URL = 'https://eimemes-chat-ai.vercel.app';
const APP_NAME = 'EimemesChat AI';

const CHROME_UA =
  'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

WebBrowser.maybeCompleteAuthSession();

// ── Typing brand text with blinking cursor ─────────────────────────────
function TypingBrand() {
  const [visibleChars, setVisibleChars] = useState(0);
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visibleChars < APP_NAME.length) {
      const t = setTimeout(() => setVisibleChars(v => v + 1), 65);
      return () => clearTimeout(t);
    }
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(cursorOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      { iterations: 3 }
    );
    blink.start();
    return () => blink.stop();
  }, [visibleChars]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={styles.brandText}>{APP_NAME.slice(0, visibleChars)}</Text>
      <Animated.Text style={[styles.cursor, { opacity: cursorOpacity }]}>|</Animated.Text>
    </View>
  );
}

export default function App() {
  const webviewRef = useRef<WebView>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const webviewOpacity = useRef(new Animated.Value(0)).current;
  const loadingOpacity = useRef(new Animated.Value(1)).current;

  // ── Network detection ──────────────────────────────────────────────────
  useEffect(() => {
    NetInfo.fetch().then(state => setIsConnected(state.isConnected ?? false));

    const unsub = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? false;
      setIsConnected(prev => {
        if (!prev && connected) {
          setTimeout(() => webviewRef.current?.reload(), 500);
        }
        return connected;
      });
    });

    return () => unsub();
  }, []);

  // ── Android hardware back button ───────────────────────────────────────
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

  // ── Fade WebView in once loaded ────────────────────────────────────────
  useEffect(() => {
    if (!loading) {
      Animated.timing(webviewOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
      Animated.timing(loadingOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    }
  }, [loading]);

  // ── Handle messages from web app ───────────────────────────────────────
  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'GOOGLE_AUTH') {
        await WebBrowser.openAuthSessionAsync(data.url, 'https://eimemes-chat-ai.vercel.app');
        setTimeout(() => webviewRef.current?.reload(), 500);
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
      <View style={styles.center}>
        <TypingBrand />
        <ActivityIndicator size="large" color="#a78bfa" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor="#13111a" barStyle="light-content" />

      {!isConnected && (
        <View style={styles.offlineScreen}>
          <Text style={styles.offlineIcon}>📡</Text>
          <Text style={styles.offlineTitle}>No Connection</Text>
          <Text style={styles.offlineSub}>
            EimemesChat needs internet to work.{'\n'}
            Check your Wi-Fi or mobile data.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.8}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      <Animated.View style={{ flex: 1, display: isConnected ? 'flex' : 'none', opacity: webviewOpacity }}>
        {loading && (
          <Animated.View style={[styles.loadingOverlay, { opacity: loadingOpacity }]}>
            <TypingBrand />
            <ActivityIndicator size="large" color="#a78bfa" style={{ marginTop: 20 }} />
          </Animated.View>
        )}

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
              url.includes('accounts.google.com') ||
              url.includes('google.com/o/oauth2') ||
              url.includes('oauth2.googleapis.com') ||
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
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => setLoading(false)}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          mediaCapturePermissionGrantType="grant"
          style={{ flex: 1, backgroundColor: '#13111a' }}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#13111a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#13111a' },
  brandText: { fontSize: 26, fontWeight: '800', color: '#f1f0f5', letterSpacing: 0.5 },
  cursor: { fontSize: 26, fontWeight: '800', color: '#a78bfa', marginLeft: 2 },
  offlineScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#13111a', padding: 32 },
  offlineIcon: { fontSize: 64, marginBottom: 20 },
  offlineTitle: { fontSize: 22, fontWeight: '700', color: '#f1f0f5', marginBottom: 10 },
  offlineSub: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 36 },
  retryBtn: { backgroundColor: '#7c3aed', paddingHorizontal: 36, paddingVertical: 13, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#13111a', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
});
