import { CourierRepository } from '@aosell/core';
import * as Location from 'expo-location';
import { Link, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/bottom-nav';
import { LanguageSwitcher } from '@/components/language-switcher';
import { MapBackdrop } from '@/components/map-backdrop';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/lib/i18n';
import { useCourierAuth } from '@/providers/courier-auth';
import { useCourierOrders } from '@/providers/courier-orders';
import type { AppUser } from '@aosell/core';

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export default function CourierHomeScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const { isLoading, currentUser, courierProfile, signUp, signIn, signInWithGoogle, signInWithApple, signOut } = useCourierAuth();

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.accent} />
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    return <AuthForm onSignIn={signIn} onSignInWithApple={signInWithApple} onSignInWithGoogle={signInWithGoogle} onSignUp={signUp} theme={theme} />;
  }

  if (!courierProfile) {
    return <OnboardingForm theme={theme} user={currentUser} />;
  }

  if (courierProfile.verificationStatus !== 'verified') {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.message, { color: theme.colors.text }]}>
          {t('pendingStatus.message', { status: courierProfile.verificationStatus })}
        </Text>
        <Pressable onPress={() => void signOut()}>
          <Text style={[styles.link, { color: theme.colors.secondaryText }]}>{t('pendingStatus.signOut')}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return <Dashboard courierId={courierProfile.id} displayName={courierProfile.displayName} theme={theme} vehicleType={courierProfile.vehicleType} city={courierProfile.city} availability={courierProfile.availability} />;
}

function AuthForm({
  onSignIn,
  onSignUp,
  onSignInWithGoogle,
  onSignInWithApple,
  theme,
}: {
  onSignIn: (i: { email: string; password: string }) => Promise<void>;
  onSignUp: (i: { email: string; password: string }) => Promise<void>;
  onSignInWithGoogle: () => Promise<void>;
  onSignInWithApple: () => Promise<void>;
  theme: ReturnType<typeof useAppTheme>;
}) {
  const { t } = useLocale();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError('');
    setIsSubmitting(true);
    try {
      if (mode === 'signIn') await onSignIn({ email, password });
      else await onSignUp({ email, password });
    } catch {
      setError(mode === 'signIn' ? t('auth.signInError') : t('auth.signUpError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSocialSignIn(method: () => Promise<void>) {
    setError('');
    setIsSubmitting(true);
    try {
      await method();
    } catch {
      setError(t('auth.socialError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.background }]}>
      <LanguageSwitcher theme={theme} />
      <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.heading }]}>{t('auth.title')}</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder={t('auth.email')}
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, borderRadius: theme.radii.lg }]}
        value={email}
      />
      <TextInput
        onChangeText={setPassword}
        placeholder={t('auth.password')}
        placeholderTextColor={theme.colors.textMuted}
        secureTextEntry
        style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, borderRadius: theme.radii.lg }]}
        value={password}
      />
      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
      <Pressable disabled={isSubmitting} onPress={() => void handleSubmit()} style={[styles.primaryButton, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.lg }]}>
        <Text style={[styles.primaryButtonText, { color: theme.colors.onAccent }]}>{isSubmitting ? '...' : mode === 'signIn' ? t('auth.signIn') : t('auth.signUp')}</Text>
      </Pressable>

      <Text style={[styles.orText, { color: theme.colors.textMuted }]}>{t('auth.or')}</Text>
      <Pressable
        disabled={isSubmitting}
        onPress={() => void handleSocialSignIn(onSignInWithGoogle)}
        style={[styles.secondaryButton, { backgroundColor: theme.colors.text, borderRadius: theme.radii.lg }]}>
        <Text style={styles.secondaryButtonText}>{t('auth.continueGoogle')}</Text>
      </Pressable>
      {Platform.OS !== 'android' ? (
        <Pressable
          disabled={isSubmitting}
          onPress={() => void handleSocialSignIn(onSignInWithApple)}
          style={[styles.secondaryButton, { backgroundColor: theme.colors.text, borderRadius: theme.radii.lg }]}>
          <Text style={styles.secondaryButtonText}>{t('auth.continueApple')}</Text>
        </Pressable>
      ) : null}

      <Pressable onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}>
        <Text style={[styles.link, { color: theme.colors.secondaryText }]}>
          {mode === 'signIn' ? t('auth.switchToSignUp') : t('auth.switchToSignIn')}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

function OnboardingForm({ user, theme }: { user: AppUser; theme: ReturnType<typeof useAppTheme> }) {
  const { t } = useLocale();
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [city, setCity] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError('');
    setIsSubmitting(true);
    try {
      await CourierRepository.create(user, { displayName, phoneNumber, city, countryCode, vehicleType: vehicleType || undefined });
    } catch {
      setError(t('onboarding.error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.heading }]}>{t('onboarding.title')}</Text>
      <TextInput onChangeText={setDisplayName} placeholder={t('onboarding.fullName')} placeholderTextColor={theme.colors.textMuted} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, borderRadius: theme.radii.lg }]} value={displayName} />
      <TextInput onChangeText={setPhoneNumber} placeholder={t('onboarding.phone')} placeholderTextColor={theme.colors.textMuted} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, borderRadius: theme.radii.lg }]} value={phoneNumber} />
      <TextInput onChangeText={setCity} placeholder={t('onboarding.city')} placeholderTextColor={theme.colors.textMuted} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, borderRadius: theme.radii.lg }]} value={city} />
      <TextInput autoCapitalize="characters" onChangeText={setCountryCode} placeholder={t('onboarding.country')} placeholderTextColor={theme.colors.textMuted} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, borderRadius: theme.radii.lg }]} value={countryCode} />
      <TextInput onChangeText={setVehicleType} placeholder={t('onboarding.vehicle')} placeholderTextColor={theme.colors.textMuted} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, borderRadius: theme.radii.lg }]} value={vehicleType} />
      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
      <Pressable disabled={isSubmitting} onPress={() => void handleSubmit()} style={[styles.primaryButton, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.lg }]}>
        <Text style={[styles.primaryButtonText, { color: theme.colors.onAccent }]}>{isSubmitting ? '...' : t('onboarding.submit')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function Dashboard({
  courierId,
  displayName,
  vehicleType,
  city,
  availability,
  theme,
}: {
  courierId: string;
  displayName: string;
  vehicleType?: string;
  city: string;
  availability: string;
  theme: ReturnType<typeof useAppTheme>;
}) {
  const { t } = useLocale();
  const { orders, offeredOrder, activeOrder } = useCourierOrders();
  const [isToggling, setIsToggling] = useState(false);
  const [locationError, setLocationError] = useState('');

  if (activeOrder) {
    return <Redirect href={activeOrder.status === 'out_for_delivery' ? '/delivery' : '/pickup'} />;
  }

  const todayDelivered = orders.filter((o) => o.status === 'delivered' && isToday(o.updatedAt));
  const gainsTodayCents = todayDelivered.reduce((sum, o) => sum + (o.courierCommission?.amountCents ?? 0), 0);
  const online = availability !== 'offline';

  async function handleToggle() {
    setLocationError('');
    setIsToggling(true);
    try {
      if (online) {
        await CourierRepository.setAvailability(courierId, 'offline');
        return;
      }
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationError(t('dashboard.locationError'));
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      await CourierRepository.setAvailability(courierId, 'available', {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    } finally {
      setIsToggling(false);
    }
  }

  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <MapBackdrop height={340}>
        <SafeAreaView edges={['top']} style={styles.headerArea}>
          <View style={[styles.headerCard, { backgroundColor: theme.colors.surface, borderRadius: theme.radii.xl }]}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.accentTint }]}>
              <Text style={[styles.avatarText, { color: theme.colors.text }]}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerName, { color: theme.colors.text }]}>{displayName}</Text>
              <Text style={[styles.headerMeta, { color: theme.colors.textMuted }]}>
                {vehicleType ? `${vehicleType} · ` : ''}
                {city}
              </Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: online ? theme.colors.successTint : theme.colors.surfaceMuted }]}>
              <Text style={[styles.statusPillText, { color: online ? theme.colors.success : theme.colors.textMuted }]}>
                {online ? t('dashboard.online') : t('dashboard.offline')}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </MapBackdrop>

      <View style={[styles.sheet, { backgroundColor: theme.colors.surface, borderRadius: theme.radii.sheet }]}>
        <View style={[styles.sheetHandle, { backgroundColor: theme.colors.border }]} />

        {offeredOrder ? (
          <Link asChild href="/offer">
            <Pressable style={[styles.offerBanner, { backgroundColor: theme.colors.text, borderRadius: theme.radii.xl }]}>
              <View style={[styles.offerDot, { backgroundColor: theme.colors.accent }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.offerTitle}>{t('dashboard.offerBannerTitle')}</Text>
                <Text style={styles.offerSubtitle}>{t('dashboard.offerBannerSubtitle')}</Text>
              </View>
              <Text style={styles.offerChevron}>›</Text>
            </Pressable>
          </Link>
        ) : null}

        <Pressable
          disabled={isToggling}
          onPress={() => void handleToggle()}
          style={[
            styles.toggleButton,
            { borderRadius: theme.radii.xl },
            online ? { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.border } : { backgroundColor: theme.colors.accent },
          ]}>
          <Text style={[styles.toggleButtonText, { color: theme.colors.text }]}>{online ? t('dashboard.goOffline') : t('dashboard.goOnline')}</Text>
        </Pressable>
        {locationError ? <Text style={[styles.error, { color: theme.colors.error }]}>{locationError}</Text> : null}

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radii.lg }]}>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{t('dashboard.earningsToday')}</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{(gainsTodayCents / 100).toFixed(2)} €</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radii.lg }]}>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{t('dashboard.deliveriesToday')}</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{todayDelivered.length}</Text>
          </View>
        </View>

        <View style={styles.navSpacer}>
          <BottomNav active="courses" theme={theme} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title: { fontSize: 22, marginBottom: 8 },
  input: { width: 280, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  primaryButton: { paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { fontSize: 15, fontWeight: '700' },
  orText: { fontSize: 12, marginTop: 4 },
  secondaryButton: { width: 280, paddingVertical: 13, alignItems: 'center' },
  secondaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  message: { fontSize: 15, textAlign: 'center' },
  link: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  error: { fontSize: 13 },

  screen: { flex: 1 },
  headerArea: { paddingHorizontal: 16, paddingTop: 16 },
  headerCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, shadowColor: '#14213D', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 6 }, shadowRadius: 20, elevation: 4 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700' },
  headerName: { fontWeight: '700', fontSize: 15 },
  headerMeta: { fontSize: 12 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  statusPillText: { fontSize: 12, fontWeight: '700' },

  sheet: { marginTop: -24, flex: 1, paddingHorizontal: 20, paddingTop: 12, gap: 16 },
  navSpacer: { marginTop: 'auto', marginHorizontal: -20 },
  sheetHandle: { width: 40, height: 4, borderRadius: 999, alignSelf: 'center' },
  offerBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  offerDot: { width: 10, height: 10, borderRadius: 5 },
  offerTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  offerSubtitle: { color: '#C9CFDC', fontSize: 12, marginTop: 2 },
  offerChevron: { color: '#FFFFFF', fontSize: 20 },
  toggleButton: { height: 56, alignItems: 'center', justifyContent: 'center' },
  toggleButtonText: { fontSize: 16, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, padding: 12, gap: 4 },
  statLabel: { fontSize: 12 },
  statValue: { fontFamily: 'Poppins_700Bold', fontSize: 18 },
});
