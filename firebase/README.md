# Firebase backend

Firestore, Cloud Functions, and Storage for the citizen science app. Everything
here runs locally against the Firebase emulators, so you don't need access to
the production project to develop.

## Prerequisites

- **Node.js 22+**. The Firebase CLI requires Node 20+ and Cloud Functions run
  on Node 22. With [nvm](https://github.com/nvm-sh/nvm):

  ```bash
  nvm install 22
  nvm use 22
  ```

- **Java 21+**. The Firestore emulator runs on the JVM. Check with
  `java -version`; on macOS you can install it with `brew install openjdk@21`.

## Setup

Run these once, from the `firebase/` directory.

1. Install the Firebase CLI globally:

   ```bash
   npm install -g firebase-tools
   ```

   Install it while Node 22 is active. With nvm, global packages are tied to
   the Node version that was active when you installed them.

2. Log in to Firebase:

   ```bash
   firebase login
   ```

   The project (`citizen-science-platform`) is already set in `.firebaserc`, so
   you don't need to run `firebase use`.

3. Install dependencies. Cloud Functions and the seed scripts share
   `functions/package.json`:

   ```bash
   cd functions
   npm install
   ```

## Running locally

Run these from `firebase/functions/`. To start the emulators and seed them in
one command:

```bash
npm run dev
```

The emulators keep running after seeding; press `Ctrl+C` to stop them. To run
the steps separately instead:

1. Start the emulators. This takes over the terminal, so keep it running:

   ```bash
   npm run emulators
   ```

   The Emulator UI is at http://localhost:4000. Firestore runs on port 8080.

2. In a second terminal, seed fake data:

   ```bash
   npm run seed
   ```

   This writes mock data around Boone, NC (the Map tab's default location).
   Browse it at http://localhost:4000/firestore.

Emulator data is cleared when the emulators stop, so run `npm run seed` again
after each restart.

## Seed data

All seed scripts only ever write to the local emulator, never to production.
They're excluded from lint and from `firebase deploy`. The mock seeds and
`seed:clear` can also be run from the repo root.

| Command | Writes | Data |
| --- | --- | --- |
| `npm run seed` | both below | Runs `seed:client-mock` and `seed:nws-mock` |
| `npm run seed:client-mock` | `hazard_zones` | 30 of the client's predicted flood boundaries, from `scripts/data/mock-client-flood-zones.json` |
| `npm run seed:nws-mock` | `nws_alerts` | 3 mock NWS flood alerts, from `scripts/data/mock-nws-alerts.json` (what `npm run dev` uses) |
| `npm run seed:clear` | `hazard_zones`, `nws_alerts` | Empties both (leaves users alone) |
| `npm run seed:client` | `hazard_zones` | Real client data from `scripts/data/Unified_FIM.gpkg` (gitignored, ask the team) |
| `npm run seed:export-client-mock` | file only | Regenerates `mock-client-flood-zones.json` from the gpkg |
| `npm run seed:users` | Auth, `users` | Test users |

### `hazard_zones` (client flood boundaries)

Shapes only: `{ geometry, active, ingestedAt }`.

### `nws_alerts` (NWS flood alerts)

Written by `pollNWSAlerts` in production. NC often has no active flood alerts,
so `seed:nws-mock` provides a Flood Warning, a Flash Flood Warning, and a
Flood Watch. Each doc is an NWS alert's `properties` (`event`, `severity`,
`onset`, `ends`, `description`, `instruction`, ...) plus `geometry` and
`ingestedAt`. `mock-nws-alerts.json` is an `api.weather.gov/alerts/active`
response, so you can paste real alerts into it; the seed shifts their times to
start now.

In both collections, `geometry` is GeoJSON **stored as a JSON string**, because
Firestore does not support nested arrays. Parse it before rendering:

```ts
const polygon = JSON.parse(doc.geometry); // { type: "Polygon", coordinates: [[[lng, lat], ...]] }
```

In `nws_alerts`, `geometry` is `null` for alerts NWS sends without a shape
(mostly Flood Watches, which only list `affectedZones`).

## Troubleshooting

- **`Firebase CLI ... is incompatible with Node.js v18`**: switch to Node 22
  (`nvm use 22`), then reinstall the CLI with `npm install -g firebase-tools`.
- **`Could not start Firestore Emulator, port taken`**: the emulators are
  already running in another terminal. Stop them there, or seed against the
  one that's running.
- **Seed script hangs or can't connect**: make sure `npm run emulators` is
  running first.
