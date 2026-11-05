import type { ExpoConfig } from 'expo/config';

function readEnv(name: string, fallback = '') {
  return process.env[name] ?? fallback;
}

const googleIosUrlScheme = readEnv('EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME');

const config: ExpoConfig = {
  name: 'AoSell',
  slug: 'aosell',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'aosell',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.amasow.aosell',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#FFB400',
      foregroundImage: './assets/images/android-icon-foreground.png',
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
    'expo-video',
    'expo-apple-authentication',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FFB400',
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
    // The iOS URL scheme (reversed iOS OAuth client ID from Google Cloud
    // Console) isn't known yet, and this plugin throws at config-resolution
    // time — which runs for every platform, including web export — if it's
    // missing. Omit the plugin entirely until it's configured; native builds
    // fail (with a Google-authored, admittedly gnarlier looking) build error
    // until then, but web/JS work stays unaffected either way.
    ...(googleIosUrlScheme
      ? [['@react-native-google-signin/google-signin', { iosUrlScheme: googleIosUrlScheme }] as [string, Record<string, string>]]
      : []),
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
    google: {
      webClientId: readEnv('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'),
      iosClientId: readEnv('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'),
    },
    eas: {
      projectId: '390d9694-24d4-47b9-8a84-c817136b1d29',
    },
  },
};

export default config;
