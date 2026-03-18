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

## App structure

```txt
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
```

## Setup

1. Install dependencies.

```bash
npm install
```

2. Start the Expo app.

```bash
npx expo start
```

3. Create your local env file from the example and add your real Firebase and Stripe values.

```bash
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

- [app.config.ts](/mnt/c/Users/aos/OneDrive%20-%20abat%20AG/Desktop/Privat/MyApps/aosell/app.config.ts)
- [app.json](/mnt/c/Users/aos/OneDrive%20-%20abat%20AG/Desktop/Privat/MyApps/aosell/app.json)
- [src/lib/firebase/config.ts](/mnt/c/Users/aos/OneDrive%20-%20abat%20AG/Desktop/Privat/MyApps/aosell/src/lib/firebase/config.ts)
- [src/lib/stripe/index.ts](/mnt/c/Users/aos/OneDrive%20-%20abat%20AG/Desktop/Privat/MyApps/aosell/src/lib/stripe/index.ts)

## Firebase

Relevant files:

- [firestore.rules](/mnt/c/Users/aos/OneDrive%20-%20abat%20AG/Desktop/Privat/MyApps/aosell/firestore.rules)
- [firestore.indexes.json](/mnt/c/Users/aos/OneDrive%20-%20abat%20AG/Desktop/Privat/MyApps/aosell/firestore.indexes.json)
- [firestore_types.ts](/mnt/c/Users/aos/OneDrive%20-%20abat%20AG/Desktop/Privat/MyApps/aosell/firestore_types.ts)
- [firebase.tsx](/mnt/c/Users/aos/OneDrive%20-%20abat%20AG/Desktop/Privat/MyApps/aosell/firebase.tsx)

Deploy commands after configuring Firebase CLI:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only functions
```

## Cloud Functions

Scaffolded in [functions/src/index.ts](/mnt/c/Users/aos/OneDrive%20-%20abat%20AG/Desktop/Privat/MyApps/aosell/functions/src/index.ts).

Expected environment variables:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Notes

- Cart is intentionally limited to one seller in V1.
- Listing editor is built around the V1 schema and seller ownership model.
- Search is Firestore-oriented and can later be upgraded with generated `searchTokens`.
- Firebase client config is now expected from Expo environment variables and is no longer committed in the repo.
- The current environment here could not run `node`, `npm`, `tsc`, or `expo` commands because the available Node setup is broken under WSL, so runtime verification is still required on a working Node installation.
