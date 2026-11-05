#!/usr/bin/env node
// One-off script: grants the `admin` custom claim that firestore.rules'
// isAdmin() checks (request.auth.token.admin == true). Nothing in this repo
// ever sets this claim otherwise, so without running this at least once, no
// one can use the admin app.
//
// Usage: node functions/scripts/grant-admin-claim.js <email-or-uid>
// Needs credentials for the aosell-3f431 project — either run
// `gcloud auth application-default login` first, or set
// GOOGLE_APPLICATION_CREDENTIALS to a service account key JSON downloaded
// from Firebase Console > Project settings > Service accounts.

const admin = require('firebase-admin');

async function main() {
  const identifier = process.argv[2];
  if (!identifier) {
    console.error('Usage: node grant-admin-claim.js <email-or-uid>');
    process.exit(1);
  }

  admin.initializeApp({ projectId: 'aosell-3f431' });

  const user = identifier.includes('@')
    ? await admin.auth().getUserByEmail(identifier)
    : await admin.auth().getUser(identifier);

  await admin.auth().setCustomUserClaims(user.uid, { ...user.customClaims, admin: true });
  console.log(`Granted admin claim to ${user.email ?? user.uid} (uid: ${user.uid}).`);
  console.log('They must sign out and back in (or get a fresh ID token) for it to take effect.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
