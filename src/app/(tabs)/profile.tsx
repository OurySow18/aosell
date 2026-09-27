import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import { AppButton } from '@/components/ui/app-button';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { StatusPill } from '@/components/ui/status-pill';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { useAosell } from '@/providers/aosell-provider';

export default function ProfileScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const { currentUser, userProfile, addresses, currentSellerProfile, logout, notifications } = useAosell();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function openSignIn() {
    router.push({ pathname: '/auth', params: { mode: 'signin', returnTo: '/profile' } });
  }

  function handleLogout() {
    if (isLoggingOut) {
      return;
    }
    setIsLoggingOut(true);
    void logout().finally(() => setIsLoggingOut(false));
  }

  if (!currentUser) {
    return (
      <AppScreen>
        <EmptyState title={t('profileScreen.noProfileTitle')} description={t('profileScreen.noProfileDescription')} />
        <AppButton fullWidth label={t('common.signIn')} onPress={openSignIn} />
      </AppScreen>
    );
  }

  if (!userProfile) {
    return (
      <AppScreen>
        <EmptyState title={t('profileScreen.loadingTitle')} description={t('profileScreen.loadingDescription')} />
        <Text style={[styles.loadingEmail, { color: theme.colors.textMuted }]}>{currentUser.email}</Text>
        <AppButton fullWidth disabled={isLoggingOut} label={t('common.logout')} variant="danger" onPress={handleLogout} />
      </AppScreen>
    );
  }

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <AppScreen>
      <SectionTitle
        eyebrow={t('profileScreen.eyebrow')}
        title={userProfile.displayName}
        description={userProfile.bio ?? t('profileScreen.fallbackDescription')}
      />

      <View style={[styles.heroCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
        <View style={styles.heroTop}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.accentTint, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
            <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.title.fontFamily }]}>
              {userProfile.displayName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.title.fontFamily }]}>
              {userProfile.displayName}
            </Text>
            <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.typography.body.fontFamily }]}>
              {currentUser.email}
            </Text>
          </View>
        </View>
        <View style={styles.row}>
          <StatusPill label={currentUser.role === 'seller' ? t('auth.seller') : t('auth.buyer')} tone="brand" />
          {currentSellerProfile ? <StatusPill label={t('profileScreen.sellerProfileActive')} tone="success" /> : null}
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatBlock theme={theme} label={t('profileScreen.addresses')} value={String(addresses.length)} />
        <StatBlock theme={theme} label={t('profileScreen.alerts')} value={String(unreadCount)} />
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
        <Text style={[styles.heading, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
          {t('profileScreen.savedAddresses')}
        </Text>
        {addresses.length ? (
          addresses.map((address) => (
            <View
              key={address.id}
              style={[styles.address, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border, borderRadius: theme.radii.md }]}>
              <Text style={[styles.body, { color: theme.colors.text, fontFamily: theme.typography.body.fontFamily }]}>{address.fullName}</Text>
              <Text style={[styles.bodySmall, { color: theme.colors.textMuted }]}>
                {address.line1}, {address.postalCode} {address.city}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.bodySmall, { color: theme.colors.textMuted }]}>{t('profileScreen.noSavedAddresses')}</Text>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
        <LanguageSwitcher />
      </View>

      <View style={styles.actions}>
        <AppButton fullWidth label={`${t('common.notifications')} (${unreadCount})`} onPress={() => router.push('/notifications')} />
        <AppButton fullWidth label={t('common.sellerCenter')} variant="secondary" onPress={() => router.push('/seller-center')} />
        <AppButton fullWidth disabled={isLoggingOut} label={t('common.logout')} variant="danger" onPress={handleLogout} />
      </View>
    </AppScreen>
  );
}

type AppTheme = ReturnType<typeof useAppTheme>;

function StatBlock({ theme, label, value }: { theme: AppTheme; label: string; value: string }) {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
      <Text style={[styles.label, { color: theme.colors.accent, fontFamily: theme.typography.micro.fontFamily }]}>{label}</Text>
      <Text style={[styles.heading, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: { borderWidth: 1, padding: 20, gap: 16 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  heroCopy: { gap: 4, flex: 1 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { borderWidth: 1, padding: 16, gap: 4, minWidth: 140, flexGrow: 1 },
  card: { borderWidth: 1, padding: 16, gap: 12 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  address: { borderWidth: 1, padding: 12, gap: 4 },
  actions: { gap: 12 },
  loadingEmail: { textAlign: 'center', fontSize: 13, lineHeight: 18 },
  label: { fontSize: 11, lineHeight: 14, textTransform: 'uppercase', letterSpacing: 0.2 },
  title: { fontSize: 22, lineHeight: 28 },
  heading: { fontSize: 17, lineHeight: 22 },
  body: { fontSize: 15, lineHeight: 21 },
  bodySmall: { fontSize: 13, lineHeight: 18 },
});
