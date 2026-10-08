# Citizen Science Flood Reporting App

## Repo structure

- `firebase/` — Firestore/Storage security rules, Cloud Functions (`functions/`), seed script (`scripts/seed.ts`).
- `mobile/` — the Expo/React Native app.

## Get a test version running

### 1. One-time setup

1. Get added as a Firebase project member (`citizen-science-platform`) and as a member of the `sandboxneu` Expo organization — ask the tech lead.
2. Install dependencies:
   ```bash
   npm install                          # repo root
   cd firebase/functions && npm install
   cd ../../mobile && npm install
   ```
3. Install the CLIs and log in:
   ```bash
   npm install -g firebase-tools eas-cli
   firebase login
   eas login
   ```
4. **iOS Simulator only:** install the full Xcode app from the App Store (Command Line Tools alone aren't enough), then:
   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   ```
   Open Xcode.app once manually after that (`Cmd+Space` → "Xcode" → enter) — let it install additional components and accept the license. Verify with `xcode-select -p` (should print `/Applications/Xcode.app/Contents/Developer`).

### 2. Run it

From the repo root:
```bash
npm run dev
```
Starts the Firebase emulator (local, isolated Firestore/Auth/Storage/Functions) and the Expo dev server together, and builds, installs and launches the app on the iOS simulator — no manual step needed. The first run compiles the native app and takes several minutes; later runs are much faster. It connects to the local emulator, not the real hosted project. `Ctrl+C` stops both.

Emulator UI (data + logs) while running: `http://127.0.0.1:4000`.
