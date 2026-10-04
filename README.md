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

## Implementing Figma designs (optional, Claude Code only)

Reference: https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/#claude-code

If you're using Claude Code to implement a screen from Figma, connect it to your Figma account once so it can pull exact dimensions/colors/spacing instead of guessing from screenshots.

### One-time setup

1. Install the plugin: `claude plugin install figma@claude-plugins-official`
2. Restart Claude Code
3. Run `/mcp`, select `figma`, click **Authenticate** — a browser window opens for Figma login, click **Allow Access** there
4. Confirm it says "Connected to figma"

The browser is only used for that one-time login. After this, you're done setting up — no need to repeat it for future screens.

### Using it (every time you implement a screen)

This part does **not** happen in the browser — it happens entirely in your Claude Code chat:

1. In Figma (browser or desktop app), click the specific frame you want implemented to select it
2. Right-click → **Copy link to selection**
3. Switch back to **Claude Code** and paste that link into the chat, e.g. "implement this screen: `<link>`"

Claude reads the exact design data from that link (dimensions, colors, spacing, layer structure) rather than guessing from a screenshot.
