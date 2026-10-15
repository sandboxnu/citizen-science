const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Lets src/lib/mock-nws-alerts.ts import the same mock alerts the emulator
// seed script uses, instead of keeping a second copy in the app.
config.watchFolders = [
  ...(config.watchFolders ?? []),
  path.resolve(__dirname, '../firebase/functions/scripts/data'),
];

module.exports = config;
