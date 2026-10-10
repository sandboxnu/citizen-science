// Default to the dev Firebase project/bundle id unless a build explicitly opts into production.
const IS_DEV = process.env.APP_VARIANT !== 'production';

export default {
  expo: {
    name: 'mobile',
    slug: 'mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'mobile',
    userInterfaceStyle: 'automatic',
    ios: {
      icon: './assets/expo.icon',
      bundleIdentifier: IS_DEV
        ? 'edu.northeastern.sandbox.citizenscience.dev'
        : 'edu.northeastern.sandbox.citizenscience',
      googleServicesFile: IS_DEV ? './GoogleService-Info.dev.plist' : './GoogleService-Info.plist',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSAppTransportSecurity: {
          NSAllowsLocalNetworking: true,
        },
      },
    },
    android: {
      package: IS_DEV
        ? 'edu.northeastern.sandbox.citizenscience.dev'
        : 'edu.northeastern.sandbox.citizenscience',
      googleServicesFile: IS_DEV ? './google-services.dev.json' : './google-services.json',
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#208AEF',
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      ],
      '@react-native-firebase/app',
      '@react-native-firebase/auth',
      './plugins/withFirebaseAppDelegateFix',
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'dynamic',
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: 'e212c08b-4336-4fb2-8178-610f1b73c37f',
      },
    },
  },
};
