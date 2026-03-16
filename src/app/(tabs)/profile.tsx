import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { StatusPill } from '@/components/ui/status-pill';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAosell } from '@/providers/aosell-provider';
import { ThemedText } from '@/components/themed-text';

export default function ProfileScreen() {
  const theme = useTheme();
  const { currentUser, userProfile, addresses, currentSellerProfile, logout, notifications } = useAosell();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!currentUser || !userProfile) {
    return (
      <AppScreen>
        <EmptyState
          title="Profile not started"
          description="Use Create account from the splash or auth screen to initialize buyer and seller flows."
        />
        <AppButton label="Open authentication" onPress={() => router.push('/auth')} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <SectionTitle
        eyebrow="Profile"
        title={userProfile.displayName}
        description={userProfile.bio ?? 'Buyer profile, seller shortcuts, addresses, and notifications.'}
      />

      <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <ThemedText type="headline">{currentUser.email}</ThemedText>
        <View style={styles.row}>
          <StatusPill label={currentUser.role} tone="brand" />
          {currentSellerProfile ? <StatusPill label="seller profile active" tone="success" /> : null}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <ThemedText type="headline">Addresses</ThemedText>
        {addresses.map((address) => (
          <View key={address.id} style={styles.address}>
            <ThemedText type="body">{address.fullName}</ThemedText>
            <ThemedText type="bodySmall" themeColor="textSecondary">
              {address.line1}, {address.postalCode} {address.city}
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <AppButton label={`Notifications (${notifications.filter((item) => !item.isRead).length})`} onPress={() => router.push('/notifications')} />
        <AppButton label="Seller center" variant="secondary" onPress={() => router.push('/seller-center')} />
        <AppButton
          disabled={isLoggingOut}
          label="Logout"
          variant="ghost"
          onPress={() => {
            setIsLoggingOut(true);
            void logout().finally(() => setIsLoggingOut(false));
          }}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  address: {
    gap: Spacing.xs,
  },
  actions: {
    gap: Spacing.md,
  },
});
