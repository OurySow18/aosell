import type { ExpoConfig } from 'expo/config';

function readEnv(name: string, fallback = '') {
  return process.env[name] ?? fallback;
}

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
  plugins: ['expo-router', 'expo-location'],
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
  },
};

export default config;
