// LoginModal.tsx — v1.1 (Expo)
// v1.1: Cleaned up Google Sign-In import, removed unused GoogleSigninButton.
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, StyleSheet, Linking, Switch, Alert,
} from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '../../firebase';
import { useApp } from '../../context/AppContext';

// Configure once at module level
GoogleSignin.configure({
  // Replace with your actual Web Client ID from Firebase Console → Project Settings → Web app
  webClientId: '230417181657-7v30t8ogq03broga9p676p3f9lltng1a.apps.googleusercontent.com',',
});

function friendlyAuthError(code: string): string {
  return ({
    'auth/email-already-in-use':   'This email is already registered. Try signing in instead.',
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/user-not-found':         'No account found with that email.',
    'auth/wrong-password':         'Incorrect password. Please try again.',
    'auth/invalid-credential':     'Incorrect email or password.',
    'auth/weak-password':          'Password must be at least 6 characters.',
    'auth/too-many-requests':      'Too many attempts. Please wait a moment.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  } as Record<string, string>)[code] ?? 'Authentication failed. Please try again.';
}

interface Props { visible: boolean; }

export default function LoginModal({ visible }: Props) {
  const { theme } = useApp();
  const [isSignUp, setIsSignUp] = useState(true);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [agreed,   setAgreed]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const disabled = !agreed || loading;

  const handleGoogle = async () => {
    if (!agreed) { setError('Please agree to the terms first.'); return; }
    try {
      setLoading(true);
      setError('');
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken || (userInfo as any).idToken;
      if (!idToken) throw new Error('No ID token returned');
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    } catch (e: any) {
      if (e.code !== 'SIGN_IN_CANCELLED') {
        setError(friendlyAuthError(e.code || ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async () => {
    if (!agreed) { setError('Please agree to the terms first.'); return; }
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    try {
      setLoading(true); setError('');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      setError(friendlyAuthError(e.code));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!agreed)          { setError('Please agree to the terms first.'); return; }
    if (!email)           { setError('Please enter your email address.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    try {
      setLoading(true); setError('');
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      setError(friendlyAuthError(e.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <View style={[styles.overlay, { backgroundColor: theme.bg }]}>
        <View style={[styles.card, { backgroundColor: theme.glass2, borderColor: theme.border }]}>

          {/* Title */}
          <Text style={[styles.title, { color: theme.accent }]}>EimemesChat AI</Text>
          <Text style={[styles.subtitle, { color: theme.text3 }]}>
            {isSignUp ? 'Create your account to get started' : 'Welcome back, sign in to continue'}
          </Text>

          {/* Email input */}
          <TextInput
            style={[styles.input, { backgroundColor: theme.glass3, borderColor: theme.border, color: theme.text1 }]}
            placeholder="Email"
            placeholderTextColor={theme.text3}
            value={email}
            onChangeText={t => { setEmail(t); setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!loading}
          />

          {/* Password input */}
          <TextInput
            style={[styles.input, { backgroundColor: theme.glass3, borderColor: theme.border, color: theme.text1 }]}
            placeholder="Password"
            placeholderTextColor={theme.text3}
            value={password}
            onChangeText={t => { setPassword(t); setError(''); }}
            secureTextEntry
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            editable={!loading}
          />

          {/* Primary button */}
          <TouchableOpacity
            onPress={isSignUp ? handleSignup : handleEmail}
            disabled={disabled}
            activeOpacity={0.8}
            style={[styles.btnPrimary, { opacity: disabled ? 0.45 : 1 }]}
          >
            <Text style={styles.btnPrimaryText}>
              {loading ? 'Please wait…' : isSignUp ? 'Create Account' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.divLine, { backgroundColor: theme.border }]} />
            <Text style={{ color: theme.text3, fontSize: 14, marginHorizontal: 10 }}>or</Text>
            <View style={[styles.divLine, { backgroundColor: theme.border }]} />
          </View>

          {/* Google button */}
          <TouchableOpacity
            onPress={handleGoogle}
            disabled={disabled}
            activeOpacity={0.8}
            style={[styles.btnGoogle, { backgroundColor: theme.glass2, borderColor: theme.border, opacity: disabled ? 0.45 : 1 }]}
          >
            {/* Google G icon */}
            <Text style={{ fontSize: 18, lineHeight: 22 }}>G</Text>
            <Text style={{ color: theme.text1, fontSize: 16, fontWeight: '500' }}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Terms checkbox */}
          <View style={styles.termsRow}>
            <Switch
              value={agreed}
              onValueChange={v => { setAgreed(v); setError(''); }}
              trackColor={{ false: theme.glass3, true: theme.accent }}
              thumbColor="#fff"
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
            <Text style={{ color: theme.text2, fontSize: 14, lineHeight: 20, flex: 1 }}>
              {'I agree to the '}
              <Text
                onPress={() => Linking.openURL('https://app-eimemeschat.vercel.app/terms.html')}
                style={{ color: theme.accent }}
              >Terms</Text>
              {' and '}
              <Text
                onPress={() => Linking.openURL('https://app-eimemeschat.vercel.app/privacy.html')}
                style={{ color: theme.accent }}
              >Privacy Policy</Text>
            </Text>
          </View>

          {/* Toggle sign in / sign up */}
          <TouchableOpacity
            onPress={() => { setIsSignUp(!isSignUp); setError(''); }}
            style={{ marginTop: 14 }}
          >
            <Text style={{ color: theme.accent, fontSize: 14, fontWeight: '500', textAlign: 'center' }}>
              {isSignUp ? 'Already have an account? Sign in' : 'New here? Create an account'}
            </Text>
          </TouchableOpacity>

          {/* Error message */}
          {!!error && (
            <Text style={{ color: '#ff6b6b', fontSize: 13.5, marginTop: 10, textAlign: 'center' }}>
              {error}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card:           { width: '100%', maxWidth: 420, borderRadius: 24, padding: 28, borderWidth: 1 },
  title:          { fontSize: 26, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  subtitle:       { fontSize: 14, marginBottom: 22, textAlign: 'center' },
  input:          { borderRadius: 40, borderWidth: 1, padding: 14, paddingHorizontal: 18, fontSize: 16, marginVertical: 6 },
  btnPrimary:     { backgroundColor: '#007aff', borderRadius: 40, padding: 14, marginVertical: 8, alignItems: 'center' },
  btnPrimaryText: { color: 'white', fontSize: 16, fontWeight: '600' },
  divider:        { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  divLine:        { flex: 1, height: 1 },
  btnGoogle:      { borderRadius: 40, borderWidth: 1, padding: 14, marginVertical: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  termsRow:       { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 16 },
});
