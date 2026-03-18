import type { ExpoConfig } from 'expo/config';

function readEnv(name: string, fallback = '') {
  return process.env[name] ?? fallback;
}

const config: ExpoConfig = {
  name: 'AoSell',
  slug: 'aosell',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'aosell',
  userInterfaceStyle: 'automatic',
  ios: {
    icon: './assets/expo.icon',
    bundleIdentifier: 'com.amasow.aosell',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#F5EFE6',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    package: 'com.amasow.aosell',
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
        backgroundColor: '#2B1B12',
        android: {
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      },
    ],
    [
      '@stripe/stripe-react-native',
      {
        merchantIdentifier: readEnv('EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER', 'merchant.com.amasow.aosell'),
        enableGooglePay: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
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
    stripe: {
      publishableKey: readEnv('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pk_test_replace_me'),
      merchantIdentifier: readEnv('EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER', 'merchant.com.amasow.aosell'),
    },
    eas: {
      projectId: '390d9694-24d4-47b9-8a84-c817136b1d29',
    },
  },
};

export default config;
