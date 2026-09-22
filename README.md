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
5. Install the dev-client build on your simulator/device — **required once** before `npm run dev` will have anything to launch (redo this if you ever erase the simulator or set up on a new machine):
   ```bash
   cd mobile && eas build:run --platform ios
   ```

### 2. Run it

From the repo root:
```bash
npm run dev
```
Starts the Firebase emulator (local, isolated Firestore/Auth/Storage/Functions) and the Expo dev server together, and automatically boots the simulator and launches the app you installed in step 5 — no manual step needed. It connects to the local emulator, not the real hosted project. `Ctrl+C` stops both.

Emulator UI (data + logs) while running: `http://127.0.0.1:4000`.
