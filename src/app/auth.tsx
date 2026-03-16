import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { AosellLogo } from '@/components/brand/aosell-logo';
import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { SectionTitle } from '@/components/ui/section-title';
import { Spacing } from '@/constants/theme';
import { useAosell } from '@/providers/aosell-provider';

export default function AuthScreen() {
  const { signInAs } = useAosell();
  const [pendingRole, setPendingRole] = useState<'buyer' | 'seller' | null>(null);

  async function handleAuth(role: 'buyer' | 'seller') {
    setPendingRole(role);

    try {
      await signInAs(role);
      router.replace(role === 'seller' ? '/seller-onboarding' : '/home');
    } finally {
      setPendingRole(null);
    }
  }

  return (
    <AppScreen>
      <View style={styles.container}>
        <AosellLogo />
        <SectionTitle
          eyebrow="Authentication"
          title="Start as buyer or seller"
          description="Firebase Auth is wired as the integration target. This screen gives you the two main roles and moves you into the V1 flows."
        />
        <View style={styles.actions}>
          <AppButton
            fullWidth
            label="Continue as buyer"
            disabled={pendingRole !== null}
            onPress={() => {
              void handleAuth('buyer');
            }}
          />
          <AppButton
            fullWidth
            label="Continue as seller"
            variant="secondary"
            disabled={pendingRole !== null}
            onPress={() => {
              void handleAuth('seller');
            }}
          />
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: '100%',
    justifyContent: 'center',
    gap: Spacing.xxl,
    maxWidth: 520,
    alignSelf: 'center',
  },
  actions: {
    gap: Spacing.md,
  },
});
