# EimemesChat AI — Expo (React Native)

Full 1:1 port of the React web app to Expo / React Native.  
Same UI, same features, same API backend — just React Native.

---

## What Changed (Web → Expo)

| Web | Expo |
|-----|------|
| `div / span / button` | `View / Text / TouchableOpacity` |
| CSS variables (`globals.css`) | `theme.ts` JS object via context |
| `localStorage` | `AsyncStorage` |
| `navigator.vibrate()` | `expo-haptics` |
| `signInWithPopup` (Google) | `@react-native-google-signin/google-signin` |
| `ReadableStream / getReader()` | `XMLHttpRequest` with `onreadystatechange` |
| `marked` + `innerHTML` | `react-native-markdown-display` |
| `browserLocalPersistence` | `getReactNativePersistence(AsyncStorage)` |
| Tailwind / CSS | `StyleSheet.create()` |
| `window.history` | in-memory `view` state |
| file `<input type="file">` | `expo-document-picker` + `expo-image-picker` |
| `navigator.clipboard` | `expo-clipboard` |
| `navigator.share` | `react-native Share` |

The `/api/chat` and `/api/title` serverless functions are **unchanged** — the app  
calls your existing Vercel deployment.

---

## Setup

### 1. Install dependencies

```bash
cd EimemesChat-Expo
npm install
```

### 2. Configure Google Sign-In

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create an **Android OAuth client ID** for `com.eimemes.chat`
3. Download `google-services.json` → place at project root
4. In `src/components/modals/LoginModal.tsx`, replace:
   ```
   230417181657-YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
   ```
   with your actual Web Client ID from Firebase Console

5. Register the GitHub Actions debug keystore SHA-1 in Firebase Console  
   (Settings → Your apps → Android → Add fingerprint)

### 3. Set your API base URL

In `src/constants.ts`:
```ts
export const API_BASE = 'https://app-eimemeschat.vercel.app';
```
Change this to your Vercel URL if different.

### 4. Run

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios

# Expo Go (for quick dev — Google Sign-In won't work in Expo Go)
npx expo start
```

---

## Build for release

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure (first time)
eas build:configure

# Android APK / AAB
eas build --platform android

# iOS
eas build --platform ios
```

---

## Project Structure

```
EimemesChat-Expo/
├── App.tsx                         # Root entry — same logic as web App.tsx
├── app.json                        # Expo config
├── src/
│   ├── firebase.ts                 # Firebase init (AsyncStorage persistence)
│   ├── theme.ts                    # Replaces CSS variables
│   ├── constants.ts                # API_BASE, DAILY_LIMIT, etc.
│   ├── types.ts                    # Unchanged from web
│   ├── context/
│   │   └── AppContext.tsx          # Global state (no browser APIs)
│   ├── hooks/
│   │   ├── useAuth.ts              # Unchanged
│   │   ├── useChat.ts              # XHR streaming instead of fetch ReadableStream
│   │   ├── useConversations.ts     # Unchanged
│   │   ├── useMessages.ts          # Unchanged
│   │   └── useTheme.ts             # AsyncStorage instead of localStorage
│   ├── lib/
│   │   ├── haptic.ts               # expo-haptics
│   │   └── markdown.ts             # Helpers only (no DOM)
│   └── components/
│       ├── App.tsx
│       ├── LoadingScreen.tsx
│       ├── Sidebar.tsx             # Animated drawer
│       ├── MessageList.tsx         # FlatList
│       ├── MessageBubble.tsx       # react-native-markdown-display
│       ├── StreamingBubble.tsx
│       ├── TypingIndicator.tsx     # Animated dots
│       ├── InputArea.tsx           # expo-document-picker / expo-image-picker
│       ├── SourcesList.tsx
│       ├── SettingsView.tsx
│       ├── ProfileView.tsx
│       ├── PersonalizationView.tsx
│       ├── AboutView.tsx
│       ├── LicensesView.tsx
│       └── modals/
│           ├── LoginModal.tsx      # Google Sign-In via native SDK
│           ├── SignOutModal.tsx
│           └── DeleteAccountModal.tsx
```
