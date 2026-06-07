# EimemesChat AI — Android WebView Wrapper

Lightweight Android APK wrapping `eimemes-chat-ai.vercel.app` in a native shell.
Built entirely from your phone — no laptop needed.

---

## Features

- No internet → custom dark offline screen (never shows Chrome NET_ERR page)
- Auto-reconnects and reloads when internet comes back
- Android back button navigates within the web app, exits only from home page
- Google OAuth fix — Chrome user agent spoof + fallback to real Chrome browser
- Dark themed loading/offline screen matching the app's purple aesthetic
- Mic & camera permissions pre-declared for voice features

---

## File Structure

```
eimemes-chat-app/
├── App.tsx                        ← entire app (WebView + net + back handler)
├── app.json                       ← Expo config (name, icon, package, permissions)
├── eas.json                       ← EAS build profiles (APK / AAB)
├── package.json                   ← all dependencies
├── tsconfig.json                  ← TypeScript config
├── babel.config.js                ← Babel config (required for build)
├── metro.config.js                ← Metro bundler config (required for build)
├── .gitignore
├── assets/
│   ├── icon.png                   ← App icon 1024×1024
│   ├── adaptive-icon.png          ← Android adaptive icon 1024×1024
│   └── splash.png                 ← Splash screen 1284×2778
└── .github/
    └── workflows/
        └── eas-build.yml          ← Auto-build APK on every push to main
```

---

## Setup Guide (Phone Only)

You need to add **3 secrets** to GitHub before the build works:

| Secret | What it is |
|---|---|
| `SSH_PRIVATE_KEY` | SSH key so GitHub Actions can authenticate securely |
| `EXPO_TOKEN` | EAS token so the build can talk to Expo servers |

---

### Step 1 — Generate SSH Key (on your phone)

1. Go to **[generate.plus/ssh](https://generate.plus/en/base64)** — actually use this site:
   **[sshgen.com](https://www.sshgen.com/)** or any online SSH key generator
   
   > Or use **Termux** on Android (free on F-Droid):
   > ```
   > pkg install openssh
   > ssh-keygen -t ed25519 -C "eimemes-build"
   > ```
   > Then run `cat ~/.ssh/id_ed25519` (private) and `cat ~/.ssh/id_ed25519.pub` (public)

2. You get two keys:
   - **Private key** — starts with `-----BEGIN OPENSSH PRIVATE KEY-----`
   - **Public key** — starts with `ssh-ed25519 AAAA...`

---

### Step 2 — Add SSH Public Key to GitHub Account

1. Go to **github.com → Settings → SSH and GPG keys**
2. Click **New SSH key**
3. Title: `EAS Build Key`
4. Paste your **public key**
5. Click **Add SSH key**

---

### Step 3 — Add Secrets to Your Repo

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**

**Secret 1:**
- Name: `SSH_PRIVATE_KEY`
- Value: paste your entire **private key** including the `-----BEGIN` and `-----END` lines

**Secret 2:**
- Name: `EXPO_TOKEN`
- Value: get from **[expo.dev](https://expo.dev) → Account → Access Tokens → Create Token**
  - Token name: `github-actions`
  - Copy the token immediately (shown only once)

---

### Step 4 — Create GitHub Repo & Upload Files

1. Go to **github.com → New repository**
2. Name: `eimemes-chat-app`, set **Private**, click Create
3. Click **Add file → Upload files**
4. Upload everything from this zip (keep folder structure)
5. Commit to `main`

> ⚠️ Make sure `.github/workflows/eas-build.yml` is in the correct nested path — GitHub needs it there to detect the workflow.

---

### Step 5 — Watch the Build

1. Go to your repo → **Actions tab**
2. You should see **"EAS Build"** workflow running
3. It takes ~10–15 minutes
4. When done, go to **[expo.dev](https://expo.dev) → Projects → eimemes-chat-ai → Builds**
5. Download the `.apk` file to your phone and install it

---

## Updating the App

To update anything after initial setup:

1. Edit any file directly in the **GitHub web editor** (tap the pencil icon)
2. Commit to `main`
3. Build triggers automatically
4. Download new APK from expo.dev when ready

---

## Changing the Target URL

In `App.tsx` line 14:

```ts
const TARGET_URL = 'https://eimemes-chat-ai.vercel.app';
```

Change to any URL you want to wrap.

---

## Build Profiles

| Profile | Output | Use for |
|---|---|---|
| `preview` | `.apk` | Direct install on your phone |
| `production` | `.aab` | Google Play Store upload |

To switch to production build, edit `.github/workflows/eas-build.yml`:
```yaml
run: eas build --platform android --profile production --non-interactive
```

---

## Google Authentication

Google blocks OAuth inside WebViews. This app handles it two ways:

1. **User agent spoof** — pretends to be Chrome (works most of the time)
2. **Fallback** — if Google's login URL is detected, opens real Chrome browser, then returns to app after login with session intact

---

## Dependencies

| Package | Purpose |
|---|---|
| `react-native-webview` | WebView component |
| `@react-native-community/netinfo` | Internet detection |
| `babel-preset-expo` | Required for Expo build |

---

Built with Expo SDK 52 · React Native 0.76 · EAS Build · No laptop required
