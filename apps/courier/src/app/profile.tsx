import { CourierRepository } from '@aosell/core';
import type { CourierVehicleType } from '@aosell/core';
import Constants from 'expo-constants';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/bottom-nav';
import { Icon } from '@/components/icon';
import type { IconName } from '@/components/icon';
import { LanguageSwitcher } from '@/components/language-switcher';
import { VEHICLE_ICON, VehicleSelect } from '@/components/vehicle-select';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/lib/i18n';
import { useCourierAuth } from '@/providers/courier-auth';

// Same inbox the customer app's support screen uses — this is a
// one-person team during testing, not a real support desk yet.
const SUPPORT_EMAIL = 'amadourys15@gmail.com';

type Tone = 'neutral' | 'success' | 'warning' | 'error';

const STATUS_KEY: Record<string, string> = {
  unverified: 'profile.statusUnverified',
  pending: 'profile.statusPending',
  verified: 'profile.statusVerified',
  rejected: 'profile.statusRejected',
};

const STATUS_TONE: Record<string, Tone> = {
  unverified: 'neutral',
  pending: 'warning',
  verified: 'success',
  rejected: 'error',
};

export default function ProfileScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const { currentUser, courierProfile, signOut } = useCourierAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [city, setCity] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [vehicleType, setVehicleType] = useState<CourierVehicleType | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!courierProfile) {
    return <Redirect href="/" />;
  }

  function startEditing() {
    setDisplayName(courierProfile!.displayName);
    setPhoneNumber(courierProfile!.phoneNumber);
    setCity(courierProfile!.city);
    setCountryCode(courierProfile!.countryCode);
    setVehicleType(courierProfile!.vehicleType);
    setError('');
    setIsEditing(true);
  }

  async function handleSave() {
    setError('');
    setIsSubmitting(true);
    try {
      await CourierRepository.updateProfile(courierProfile!.id, {
        displayName,
        phoneNumber,
        city,
        countryCode,
        vehicleType,
      });
      setIsEditing(false);
    } catch {
      setError(t('profile.editError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  const initials = courierProfile.displayName.slice(0, 2).toUpperCase();
  const statusKey = STATUS_KEY[courierProfile.verificationStatus] ?? STATUS_KEY.unverified;
  const appVersion = Constants.expoConfig?.version ?? '0.1.0';

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.heading }]}>{t('profile.title')}</Text>
          <LanguageSwitcher theme={theme} />
        </View>
        <View style={styles.identity}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.accentTint, borderColor: theme.colors.accent }]}>
            <Text style={[styles.avatarText, { color: theme.colors.text }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.colors.text }]}>{courierProfile.displayName}</Text>
            {currentUser?.email ? <Text style={[styles.email, { color: theme.colors.textMuted }]}>{currentUser.email}</Text> : null}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radii.lg }, theme.shadows.sm]}>
          <View style={[styles.statIconWrap, { backgroundColor: theme.colors.accentTint, borderRadius: theme.radii.md }]}>
            <Icon color={theme.colors.text} name="chart" size={18} />
          </View>
          <View>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{t('profile.totalEarned')}</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{((courierProfile.totalEarnedCents ?? 0) / 100).toFixed(2)} €</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }, theme.shadows.sm]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Icon color={theme.colors.textMuted} name="person" size={16} />
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{t('profile.infoTitle')}</Text>
            </View>
            {!isEditing ? (
              <Pressable onPress={startEditing}>
                <Text style={[styles.editLink, { color: theme.colors.secondaryText }]}>{t('profile.edit')}</Text>
              </Pressable>
            ) : null}
          </View>

          {isEditing ? (
            <>
              <EditField label={t('onboarding.fullName')} onChangeText={setDisplayName} theme={theme} value={displayName} />
              <EditField label={t('onboarding.phone')} onChangeText={setPhoneNumber} theme={theme} value={phoneNumber} />
              <EditField label={t('onboarding.city')} onChangeText={setCity} theme={theme} value={city} />
              <EditField autoCapitalize="characters" label={t('onboarding.country')} onChangeText={setCountryCode} theme={theme} value={countryCode} />
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{t('onboarding.vehicle')}</Text>
                <VehicleSelect onChange={setVehicleType} theme={theme} value={vehicleType} />
              </View>
              {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
              <View style={styles.editActions}>
                <Pressable
                  disabled={isSubmitting}
                  onPress={() => setIsEditing(false)}
                  style={[styles.secondaryButton, { borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
                  <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>{t('profile.cancel')}</Text>
                </Pressable>
                <Pressable
                  disabled={isSubmitting}
                  onPress={() => void handleSave()}
                  style={[styles.primaryButton, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.lg }]}>
                  <Text style={[styles.primaryButtonText, { color: theme.colors.onAccent }]}>{isSubmitting ? '...' : t('profile.save')}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <InfoRow icon="phone" label={t('profile.phone')} theme={theme} value={courierProfile.phoneNumber} />
              <InfoRow icon="pin" label={t('profile.city')} theme={theme} value={`${courierProfile.city}, ${courierProfile.countryCode}`} />
              {courierProfile.vehicleType ? (
                <InfoRow
                  icon={VEHICLE_ICON[courierProfile.vehicleType]}
                  label={t('profile.vehicle')}
                  theme={theme}
                  value={t(`vehicle.${courierProfile.vehicleType}`)}
                />
              ) : null}
              <InfoRow icon="badge" label={t('profile.status')} last theme={theme} tone={STATUS_TONE[courierProfile.verificationStatus]} value={t(statusKey)} />
            </>
          )}
        </View>

        <Pressable
          onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          style={[styles.supportCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }, theme.shadows.sm]}>
          <View style={[styles.supportIcon, { backgroundColor: theme.colors.accentTint, borderRadius: theme.radii.md }]}>
            <Icon color={theme.colors.text} name="message" size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.supportTitle, { color: theme.colors.text }]}>{t('profile.supportTitle')}</Text>
            <Text style={[styles.supportEmail, { color: theme.colors.textMuted }]}>{SUPPORT_EMAIL}</Text>
          </View>
        </Pressable>

        <Pressable onPress={() => void signOut()} style={styles.signOutRow}>
          <Text style={[styles.signOutText, { color: theme.colors.secondaryText }]}>{t('profile.signOut')}</Text>
        </Pressable>

        <Text style={[styles.version, { color: theme.colors.textMuted }]}>{t('profile.version', { version: appVersion })}</Text>
      </ScrollView>

      <BottomNav active="profile" theme={theme} />
    </View>
  );
}

function EditField({
  label,
  value,
  onChangeText,
  theme,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  theme: ReturnType<typeof useAppTheme>;
  autoCapitalize?: 'none' | 'characters' | 'words' | 'sentences';
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        onChangeText={onChangeText}
        style={[styles.fieldInput, { borderColor: theme.colors.border, color: theme.colors.text, borderRadius: theme.radii.lg }]}
        value={value}
      />
    </View>
  );
}

const TONE_COLORS: Record<Tone, (theme: ReturnType<typeof useAppTheme>) => { bg: string; fg: string }> = {
  neutral: (theme) => ({ bg: theme.colors.surfaceMuted, fg: theme.colors.textMuted }),
  success: (theme) => ({ bg: theme.colors.successTint, fg: theme.colors.success }),
  warning: (theme) => ({ bg: theme.colors.warningTint, fg: theme.colors.warning }),
  error: (theme) => ({ bg: theme.colors.errorTint, fg: theme.colors.error }),
};

function InfoRow({
  icon,
  label,
  value,
  theme,
  last,
  tone,
}: {
  icon: IconName;
  label: string;
  value: string;
  theme: ReturnType<typeof useAppTheme>;
  last?: boolean;
  tone?: Tone;
}) {
  const toneColors = tone ? TONE_COLORS[tone](theme) : null;

  return (
    <View style={[styles.infoRow, !last && { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
      <View style={styles.infoLeft}>
        <Icon color={theme.colors.textMuted} name={icon} size={16} />
        <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      </View>
      {toneColors ? (
        <View style={[styles.tonePill, { backgroundColor: toneColors.bg, borderRadius: theme.radii.pill }]}>
          <Text style={[styles.tonePillText, { color: toneColors.fg }]}>{value}</Text>
        </View>
      ) : (
        <Text style={[styles.infoValue, { color: theme.colors.text }]}>{value}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerArea: { paddingHorizontal: 20, paddingBottom: 16, gap: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  avatarText: { fontWeight: '700', fontSize: 16 },
  name: { fontSize: 16, fontWeight: '700' },
  email: { fontSize: 13, marginTop: 2 },

  body: { paddingHorizontal: 20, paddingBottom: 24, gap: 14 },
  statCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  statIconWrap: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 12 },
  statValue: { fontFamily: 'Poppins_700Bold', fontSize: 24 },

  card: { borderWidth: 1, padding: 16, gap: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  editLink: { fontSize: 13, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  tonePill: { paddingHorizontal: 10, paddingVertical: 4 },
  tonePillText: { fontSize: 12, fontWeight: '700' },

  fieldWrap: { gap: 4, marginTop: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '600' },
  fieldInput: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  error: { fontSize: 13, marginTop: 8 },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  secondaryButton: { flex: 1, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { fontSize: 14, fontWeight: '700' },
  primaryButton: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  primaryButtonText: { fontSize: 14, fontWeight: '700' },

  supportCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, padding: 14 },
  supportIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  supportTitle: { fontSize: 14, fontWeight: '700' },
  supportEmail: { fontSize: 12, marginTop: 2 },

  signOutRow: { alignItems: 'center', paddingVertical: 10, marginTop: 4 },
  signOutText: { fontSize: 14, fontWeight: '700' },
  version: { fontSize: 11, textAlign: 'center' },
});
