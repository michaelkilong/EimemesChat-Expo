// firebase.ts — v1.1 (Expo)
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth, getAuth,
  getReactNativePersistence, GoogleAuthProvider,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey:            'AIzaSyBN2p4Cwovn6uNs_bayDClloRpVdXOzJ3U',
  authDomain:        'chat-eimeme.firebaseapp.com',
  projectId:         'chat-eimeme',
  storageBucket:     'chat-eimeme.firebasestorage.app',
  messagingSenderId: '230417181657',
  appId:             '1:230417181657:web:dfa64664a3d9931bf387c8',
  measurementId:     'G-B89BXS66V',
};

// Guard against double-init on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth — catch "already initialized" error from hot reload
let _auth: ReturnType<typeof getAuth>;
try {
  _auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  _auth = getAuth(app);
}

export const auth  = _auth;
export const db    = getFirestore(app);
export const gauth = new GoogleAuthProvider();
