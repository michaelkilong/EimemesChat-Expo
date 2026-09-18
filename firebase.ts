// firebase.ts — EimemesChat-Expo
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBN2p4Cwovn6uNs_bayDClloRpVdXOzJ3U',
  authDomain: 'chat-eimeme.firebaseapp.com',
  projectId: 'chat-eimeme',
  storageBucket: 'chat-eimeme.firebasestorage.app',
  messagingSenderId: '230417181657',
  appId: '1:230417181657:web:dfa64664a3d9931bf387c8',
  measurementId: 'G-B89BXS66V',
};

// Avoid re-initializing on hot reload
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// React Native requires AsyncStorage persistence; browserLocalPersistence is web-only
let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  }) as any;
} catch {
  // Already initialized (hot reload) — fall back
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export default app;