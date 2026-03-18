import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { AppButton } from '@/components/ui/app-button';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { StatusPill } from '@/components/ui/status-pill';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { useAosell } from '@/providers/aosell-provider';
import { ThemedText } from '@/components/themed-text';

export default function ProfileScreen() {
  const theme = useTheme();
  const { t } = useLocale();
  const { currentUser, userProfile, addresses, currentSellerProfile, logout, notifications } = useAosell();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!currentUser) {
    return (
      <AppScreen>
        <EmptyState
          title={t('profileScreen.noProfileTitle')}
          description={t('profileScreen.noProfileDescription')}
        />
        <AppButton
          label={t('profileScreen.signInCta')}
          onPress={() =>
            router.push({
              pathname: '/auth',
              params: {
                mode: 'signin',
                returnTo: '/profile',
              },
            })
          }
        />
      </AppScreen>
    );
  }

  if (!userProfile) {
    return (
      <AppScreen>
        <EmptyState
          title={t('profileScreen.loadingTitle')}
          description={t('profileScreen.loadingDescription')}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <SectionTitle
        eyebrow={t('profileScreen.eyebrow')}
        title={userProfile.displayName}
        description={userProfile.bio ?? t('profileScreen.fallbackDescription')}
      />

      <View style={[styles.heroCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={[styles.heroGlow, { backgroundColor: theme.gold }]} />
        <View style={styles.heroTop}>
          <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
            <ThemedText type="title">{userProfile.displayName.slice(0, 2).toUpperCase()}</ThemedText>
          </View>
          <View style={styles.heroCopy}>
            <ThemedText type="title">{userProfile.displayName}</ThemedText>
            <ThemedText type="body" themeColor="textSecondary">
              {currentUser.email}
            </ThemedText>
          </View>
        </View>
        <View style={styles.row}>
          <StatusPill label={currentUser.role === 'seller' ? t('auth.seller') : t('auth.buyer')} tone="brand" />
          {currentSellerProfile ? <StatusPill label={t('profileScreen.sellerProfileActive')} tone="success" /> : null}
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText type="label" themeColor="burntOrange">
            {t('profileScreen.addresses')}
          </ThemedText>
          <ThemedText type="headline">{String(addresses.length)}</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText type="label" themeColor="burntOrange">
            {t('profileScreen.alerts')}
          </ThemedText>
          <ThemedText type="headline">{String(notifications.filter((item) => !item.isRead).length)}</ThemedText>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <ThemedText type="headline">{t('profileScreen.savedAddresses')}</ThemedText>
        {addresses.length ? (
          addresses.map((address) => (
            <View
              key={address.id}
              style={[styles.address, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
              <ThemedText type="body">{address.fullName}</ThemedText>
              <ThemedText type="bodySmall" themeColor="textSecondary">
                {address.line1}, {address.postalCode} {address.city}
              </ThemedText>
            </View>
          ))
        ) : (
          <ThemedText type="bodySmall" themeColor="textSecondary">
            {t('profileScreen.noSavedAddresses')}
          </ThemedText>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <LanguageSwitcher />
      </View>

      <View style={styles.actions}>
        <AppButton
          fullWidth
          label={`${t('common.notifications')} (${notifications.filter((item) => !item.isRead).length})`}
          onPress={() => router.push('/notifications')}
        />
        <AppButton fullWidth label={t('common.sellerCenter')} variant="secondary" onPress={() => router.push('/seller-center')} />
        <AppButton
          fullWidth
          disabled={isLoggingOut}
          label={t('common.logout')}
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
  heroCard: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.xl,
    gap: Spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -100,
    right: -80,
    opacity: 0.45,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  heroCopy: {
    gap: Spacing.xs,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.lg,
    gap: Spacing.xs,
    minWidth: 140,
    flexGrow: 1,
  },
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
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  actions: {
    gap: Spacing.md,
  },
});
