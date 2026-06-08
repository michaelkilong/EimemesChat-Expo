// App.tsx
// EimemesChat AI — WebView Wrapper
// v1.3 — expo-web-browser for Google Auth + in-app browser for external links

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
} from 'react-native';
import { WebView } from 'react-native-webview';
import NetInfo from '@react-native-community/netinfo';
import * as WebBrowser from 'expo-web-browser';

const TARGET_URL = 'https://eimemes-chat-ai.vercel.app';

const CHROME_UA =
  'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

// Required for expo-web-browser auth redirect
WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const webviewRef = useRef<WebView>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Network detection ──────────────────────────────────────────────────
  useEffect(() => {
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected ?? false);
    });

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

  // ── Open URL in in-app browser ─────────────────────────────────────────
  const openInAppBrowser = async (url: string) => {
    await WebBrowser.openBrowserAsync(url, {
      toolbarColor: '#13111a',
      controlsColor: '#a78bfa',
      showTitle: true,
      enableBarCollapsing: true,
    });
    // After browser closes, reload WebView to pick up auth session
    setTimeout(() => webviewRef.current?.reload(), 500);
  };

  if (isConnected === null) {
    return (
      <View style={styles.center}>
        <Text style={styles.brandText}>EimemesChat AI</Text>
        <ActivityIndicator size="large" color="#a78bfa" style={{ marginTop: 16 }} />
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
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() =>
              NetInfo.fetch().then(s => setIsConnected(s.isConnected ?? false))
            }
            activeOpacity={0.8}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ flex: 1, display: isConnected ? 'flex' : 'none' }}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.brandText}>EimemesChat AI</Text>
            <ActivityIndicator size="large" color="#a78bfa" style={{ marginTop: 16 }} />
          </View>
        )}

        <WebView
          ref={webviewRef}
          source={{ uri: TARGET_URL }}
          userAgent={CHROME_UA}
          originWhitelist={['*']}
          mixedContentMode="always"
          thirdPartyCookiesEnabled
          onShouldStartLoadWithRequest={request => {
            const { url } = request;

            // Always allow app's own domain
            if (url.startsWith('https://eimemes-chat-ai.vercel.app')) {
              return true;
            }

            // Google auth → in-app browser
            if (
              url.includes('accounts.google.com') ||
              url.includes('google.com/o/oauth2') ||
              url.includes('oauth2.googleapis.com')
            ) {
              openInAppBrowser(url);
              return false;
            }

            // Any other external link → in-app browser
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#13111a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#13111a' },
  brandText: { fontSize: 26, fontWeight: '800', color: '#a78bfa', letterSpacing: 0.5 },
  offlineScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#13111a', padding: 32 },
  offlineIcon: { fontSize: 64, marginBottom: 20 },
  offlineTitle: { fontSize: 22, fontWeight: '700', color: '#f1f0f5', marginBottom: 10 },
  offlineSub: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 36 },
  retryBtn: { backgroundColor: '#7c3aed', paddingHorizontal: 36, paddingVertical: 13, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#13111a', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
});