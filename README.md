# AoSell

AoSell is a premium mobile marketplace for products, meals, and services.

## Current state

This repository now contains:

- an AoSell branded Expo Router app shell
- buyer and seller navigation flows
- discovery, search, listing detail, cart, checkout, orders, seller onboarding, seller dashboard, profile, and notifications screens
- domain and Firestore types kept separate
- Firebase app scaffolding for Auth, Firestore, and Storage
- repository modules and Zod validations
- Cloud Functions scaffolding for Stripe and notifications
- Firestore composite indexes for the MVP query model

The app now wires Firebase Authentication and Firestore subscriptions into the provider layer. Public sellers and active listings load from Firestore, private buyer/seller state subscribes after sign-in, and key mutations write back to Firestore. Seeded data remains as a fallback for the public marketplace shell if Firestore is unavailable or empty during local development.

## Repository structure

This is an npm workspaces monorepo. The Expo app lives under `apps/`, and code shared across apps (currently just the domain/Firestore types) lives under `packages/`. Cloud Functions (`functions/`) and the Firebase project config (`firebase.json`, `firestore.rules`, `storage.rules`, `firestore.indexes.json`) stay at the repo root, since they describe the backend rather than any one app.

```txt
apps/
  customer/        buyer + seller Expo Router app (mobile + web)
    src/
      app/
      components/
      lib/
        firebase/
        stripe/
        utils/
        validations/
      providers/
      repositories/
      services/
      types/
packages/
  core/            @aosell/core — domain + Firestore types shared across apps
functions/         Cloud Functions (Stripe, notifications, video transcoding)
```

Future apps (an admin dashboard, a courier app) will live alongside `apps/customer` and depend on `@aosell/core`.

## Setup

1. Install dependencies (installs every workspace at once).

```bash
npm install
```

2. Start the Expo app (either from the root, or directly in `apps/customer`).

```bash
npm run web
# or
cd apps/customer && npx expo start
```

3. Create your local env file from the example and add your real Firebase and Stripe values.

```bash
cd apps/customer
cp .env.example .env
```

Required Expo env keys:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER`

4. Rebuild the app after changing native or Expo config.

```bash
npx expo prebuild --clean
npx expo run:android
```

Relevant config files:

- [apps/customer/app.config.ts](apps/customer/app.config.ts)
- [apps/customer/src/lib/firebase/config.ts](apps/customer/src/lib/firebase/config.ts)
- [apps/customer/src/lib/stripe/index.ts](apps/customer/src/lib/stripe/index.ts)

## Firebase

Relevant files:

- [firestore.rules](firestore.rules)
- [firestore.indexes.json](firestore.indexes.json)
- [packages/core/firestore_types.ts](packages/core/firestore_types.ts)

Deploy commands after configuring Firebase CLI:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only functions
```

## Cloud Functions

Scaffolded in [functions/src/index.ts](functions/src/index.ts).

Expected environment variables:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Notes

- Cart is intentionally limited to one seller in V1.
- Listing editor is built around the V1 schema and seller ownership model.
- Search is Firestore-oriented and can later be upgraded with generated `searchTokens`.
- Firebase client config is now expected from Expo environment variables and is no longer committed in the repo.
