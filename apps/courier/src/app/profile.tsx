import { Redirect } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/bottom-nav';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/lib/i18n';
import { useCourierAuth } from '@/providers/courier-auth';

const STATUS_KEY: Record<string, string> = {
  unverified: 'profile.statusUnverified',
  pending: 'profile.statusPending',
  verified: 'profile.statusVerified',
  rejected: 'profile.statusRejected',
};

export default function ProfileScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const { courierProfile, signOut } = useCourierAuth();

  if (!courierProfile) {
    return <Redirect href="/" />;
  }

  const initials = courierProfile.displayName.slice(0, 2).toUpperCase();
  const statusKey = STATUS_KEY[courierProfile.verificationStatus] ?? STATUS_KEY.unverified;

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.heading }]}>{t('profile.title')}</Text>
          <LanguageSwitcher theme={theme} />
        </View>
        <View style={styles.identity}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.accentTint }]}>
            <Text style={[styles.avatarText, { color: theme.colors.text }]}>{initials}</Text>
          </View>
          <View>
            <Text style={[styles.name, { color: theme.colors.text }]}>{courierProfile.displayName}</Text>
            <Text style={[styles.phone, { color: theme.colors.textMuted }]}>{courierProfile.phoneNumber}</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
        <InfoRow label={t('profile.phone')} theme={theme} value={courierProfile.phoneNumber} />
        <InfoRow label={t('profile.city')} theme={theme} value={`${courierProfile.city}, ${courierProfile.countryCode}`} />
        {courierProfile.vehicleType ? <InfoRow label={t('profile.vehicle')} theme={theme} value={courierProfile.vehicleType} /> : null}
        <InfoRow label={t('profile.status')} theme={theme} value={t(statusKey)} />
        <InfoRow last label={t('profile.totalEarned')} theme={theme} value={`${((courierProfile.totalEarnedCents ?? 0) / 100).toFixed(2)} €`} />
      </View>

      <Pressable onPress={() => void signOut()} style={styles.signOutRow}>
        <Text style={[styles.signOutText, { color: theme.colors.secondaryText }]}>{t('profile.signOut')}</Text>
      </Pressable>

      <View style={styles.spacer} />
      <BottomNav active="profile" theme={theme} />
    </View>
  );
}

function InfoRow({
  label,
  value,
  theme,
  last,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useAppTheme>;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
      <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerArea: { paddingHorizontal: 20, paddingBottom: 16, gap: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700', fontSize: 16 },
  name: { fontSize: 16, fontWeight: '700' },
  phone: { fontSize: 13, marginTop: 2 },
  card: { marginHorizontal: 20, borderWidth: 1, paddingHorizontal: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  signOutRow: { alignItems: 'center', paddingVertical: 20 },
  signOutText: { fontSize: 14, fontWeight: '700' },
  spacer: { flex: 1 },
});
