import type { ExpoConfig } from 'expo/config';

function readEnv(name: string, fallback = '') {
  return process.env[name] ?? fallback;
}

const googleIosUrlScheme = readEnv('EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME');

const config: ExpoConfig = {
  name: 'AoSell Courier',
  slug: 'aosell-courier',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'aosellcourier',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.amasow.aosellcourier',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSLocationWhenInUseUsageDescription:
        "AoSell Courier a besoin de ta position pour te proposer des livraisons proches de toi.",
    },
  },
  android: {
    package: 'com.amasow.aosellcourier',
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
  },
  web: {
    output: 'static',
  },
  plugins: [
    'expo-router',
    'expo-location',
    'expo-apple-authentication',
    // Same deferred-plugin pattern as apps/customer: this plugin throws at
    // config-resolution time (including for web export) if the iOS URL
    // scheme isn't set yet, so it's omitted entirely until it is.
    ...(googleIosUrlScheme
      ? [['@react-native-google-signin/google-signin', { iosUrlScheme: googleIosUrlScheme }] as [string, Record<string, string>]]
      : []),
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    firebase: {
      apiKey: readEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
      authDomain: readEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
      projectId: readEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
      storageBucket: readEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: readEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
      appId: readEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
    },
    google: {
      webClientId: readEnv('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'),
      iosClientId: readEnv('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'),
    },
    eas: {
      projectId: '25c2fd13-11a1-4a39-af7c-84c613ae2697',
    },
  },
};

export default config;
