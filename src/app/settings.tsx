import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { SectionTitle } from '@/components/ui/section-title';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useAppTheme, useThemeMode, type ThemeMode } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { useAosell } from '@/providers/aosell-provider';

export default function SettingsScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const { themeMode, setThemeMode } = useThemeMode();
  const { addresses, logout, notifications } = useAosell();
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const themeModeOptions: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: t('profileScreen.appearanceSystem') },
    { value: 'light', label: t('profileScreen.appearanceLight') },
    { value: 'dark', label: t('profileScreen.appearanceDark') },
  ];

  function handleLogout() {
    if (isLoggingOut) {
      return;
    }
    setIsLoggingOut(true);
    void logout().finally(() => setIsLoggingOut(false));
  }

  return (
    <AppScreen>
      <SectionTitle eyebrow={t('settingsScreen.eyebrow')} title={t('settingsScreen.title')} />

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

      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
        <Text style={[styles.heading, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
          {t('profileScreen.appearance')}
        </Text>
        <SegmentedControl options={themeModeOptions} value={themeMode} onChange={(mode) => void setThemeMode(mode)} />
      </View>

      <View style={styles.actions}>
        <AppButton fullWidth label={`${t('common.notifications')} (${unreadCount})`} onPress={() => router.push('/notifications')} />
        <AppButton fullWidth label={t('common.viewAllOrders')} onPress={() => router.push('/orders')} />
        <AppButton fullWidth label={t('common.sellerCenter')} variant="secondary" onPress={() => router.push('/seller-center')} />
        <AppButton fullWidth disabled={isLoggingOut} label={t('common.logout')} variant="danger" onPress={handleLogout} />
        <AppButton fullWidth label={t('deleteAccount.deleteButton')} variant="ghost" onPress={() => router.push('/delete-account')} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 16, gap: 12 },
  address: { borderWidth: 1, padding: 12, gap: 4 },
  actions: { gap: 12 },
  heading: { fontSize: 17, lineHeight: 22 },
  body: { fontSize: 15, lineHeight: 21 },
  bodySmall: { fontSize: 13, lineHeight: 18 },
});
