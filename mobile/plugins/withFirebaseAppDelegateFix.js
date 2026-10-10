const { withAppDelegate } = require('@expo/config-plugins');

const CONFIGURE_CALL = 'FirebaseApp.configure()';
const ANCHOR = /reactNativeFactory = factory\n/;

// @react-native-firebase/app's own config plugin inserts FirebaseApp.configure()
// by matching `self.moduleName = "..."` or `factory.startReactNative(`, both of
// which moved out of AppDelegate.swift and into SceneDelegate.swift once Expo's
// template adopted the scene-based lifecycle (required by iOS 27+). That plugin
// silently skips insertion when it can't find those anchors, leaving Firebase
// never initialized and the app crashing on first launch. This re-inserts the
// call ourselves, anchored to a line that's still present in the new template.
module.exports = function withFirebaseAppDelegateFix(config) {
  return withAppDelegate(config, (config) => {
    const { modResults } = config;

    if (modResults.language !== 'swift') {
      return config;
    }

    if (modResults.contents.includes(CONFIGURE_CALL)) {
      return config;
    }

    if (!ANCHOR.test(modResults.contents)) {
      throw new Error(
        'withFirebaseAppDelegateFix: could not find the expected insertion point in ' +
          'AppDelegate.swift. The native template probably changed again — inspect ' +
          'ios/<app>/AppDelegate.swift after prebuild and update plugins/withFirebaseAppDelegateFix.js.'
      );
    }

    modResults.contents = modResults.contents.replace(
      ANCHOR,
      `reactNativeFactory = factory\n\n    ${CONFIGURE_CALL}\n`
    );

    return config;
  });
};
