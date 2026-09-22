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

3. Install dependencies. Cloud Functions and the seed script share
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

   This writes 5 fake NC flood alerts (warnings, a watch, and an advisory) to
   the `hazard_zones` collection. Browse them at
   http://localhost:4000/firestore. Their expiry times are relative to when you
   run the script, so re-run it to refresh them.

Emulator data is cleared when the emulators stop, so run `npm run seed` again
after each restart.

## Seed data

[`functions/scripts/seed.ts`](functions/scripts/seed.ts) exists because there are often no active
NC flood alerts from the National Weather Service to build the map against. It
only ever writes to the local emulator, never to production. It's excluded
from lint and from `firebase deploy`, so it never ships with the functions.

Each `hazard_zones` document uses the field names from the NWS alerts API
(`event`, `severity`, `certainty`, `urgency`, `headline`, `areaDesc`,
`expires`, ...), with two differences:

- `onset` and `expires` are Firestore Timestamps instead of strings.
- `geometry` is a GeoJSON Polygon **stored as a JSON string**, because
  Firestore does not support nested arrays. Parse it before rendering:

  ```ts
  const polygon = JSON.parse(doc.geometry); // { type: "Polygon", coordinates: [[[lng, lat], ...]] }
  ```

The polygons are real NC boundaries: county and coastal zones from
`api.weather.gov/zones`, simplified, plus one real flash flood warning polygon.

## Troubleshooting

- **`Firebase CLI ... is incompatible with Node.js v18`**: switch to Node 22
  (`nvm use 22`), then reinstall the CLI with `npm install -g firebase-tools`.
- **`Could not start Firestore Emulator, port taken`**: the emulators are
  already running in another terminal. Stop them there, or seed against the
  one that's running.
- **Seed script hangs or can't connect**: make sure `npm run emulators` is
  running first.
