import { CourierRepository } from '@aosell/core';
import * as Location from 'expo-location';
import { Link, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/bottom-nav';
import { LanguageSwitcher } from '@/components/language-switcher';
import { MapBackdrop } from '@/components/map-backdrop';
import { AppleIcon, GoogleIcon } from '@/components/social-icons';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/lib/i18n';
import { useCourierAuth } from '@/providers/courier-auth';
import { useCourierOrders } from '@/providers/courier-orders';
import { lightTheme } from '@aosell/core';
import type { AppUser } from '@aosell/core';

const HERO_NAVY = '#14213D';
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export default function CourierHomeScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const { isLoading, currentUser, courierProfile, signUp, signIn, signInWithGoogle, signInWithApple, resetPassword, signOut } = useCourierAuth();

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.accent} />
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    return (
      <AuthForm
        onResetPassword={resetPassword}
        onSignIn={signIn}
        onSignInWithApple={signInWithApple}
        onSignInWithGoogle={signInWithGoogle}
        onSignUp={signUp}
        theme={theme}
      />
    );
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
  onResetPassword,
  theme,
}: {
  onSignIn: (i: { email: string; password: string }) => Promise<void>;
  onSignUp: (i: { email: string; password: string }) => Promise<void>;
  onSignInWithGoogle: () => Promise<void>;
  onSignInWithApple: () => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  theme: ReturnType<typeof useAppTheme>;
}) {
  const { t } = useLocale();
  const isWeb = Platform.OS === 'web';
  // This screen keeps a fixed dark-hero/light-sheet look regardless of the
  // device's system theme (like the design mockup), rather than following
  // useAppTheme — the sheet/hero contrast would otherwise invert in dark mode.
  const formColors = lightTheme.colors;
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const isValid = EMAIL_PATTERN.test(email.trim()) && password.length >= 6;

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

  async function handleForgotPassword() {
    if (!EMAIL_PATTERN.test(email.trim())) {
      return;
    }
    setResetStatus('sending');
    try {
      await onResetPassword(email);
      setResetStatus('sent');
    } catch {
      setResetStatus('error');
    }
  }

  const heroBadgeText = 'AoSell · Livreur';
  const heroTitle = mode === 'signIn' ? t('auth.welcomeBackTitle') : t('auth.createAccountTitle');
  const heroSubtitle = mode === 'signIn' ? t('auth.welcomeBackSubtitle') : t('auth.createAccountSubtitle');

  const formFields = (
    <>
      <Text style={[styles.fieldLabel, { color: formColors.textMuted }]}>{t('auth.emailLabel')}</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder={t('auth.email')}
        placeholderTextColor={formColors.textMuted}
        style={[styles.fieldInput, { borderColor: formColors.border, color: formColors.text, borderRadius: theme.radii.lg }]}
        value={email}
      />

      <Text style={[styles.fieldLabel, { color: formColors.textMuted }]}>{t('auth.passwordLabel')}</Text>
      <View style={[styles.passwordRow, { borderColor: formColors.border, borderRadius: theme.radii.lg }]}>
        <TextInput
          onChangeText={setPassword}
          placeholder={t('auth.password')}
          placeholderTextColor={formColors.textMuted}
          secureTextEntry={!showPassword}
          style={[styles.passwordInput, { color: formColors.text }]}
          value={password}
        />
        <Pressable onPress={() => setShowPassword((v) => !v)}>
          <Text style={[styles.passwordToggle, { color: formColors.secondaryText }]}>
            {showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
          </Text>
        </Pressable>
      </View>

      {mode === 'signIn' ? (
        <Pressable onPress={() => void handleForgotPassword()} style={styles.forgotRow}>
          <Text style={[styles.forgotText, { color: formColors.secondaryText }]}>
            {resetStatus === 'sending' ? '...' : t('auth.forgotPassword')}
          </Text>
        </Pressable>
      ) : null}
      {resetStatus === 'sent' ? <Text style={[styles.success, { color: formColors.success }]}>{t('auth.resetSent')}</Text> : null}
      {resetStatus === 'error' ? <Text style={[styles.error, { color: formColors.error }]}>{t('auth.resetError')}</Text> : null}

      {error ? <Text style={[styles.error, { color: formColors.error }]}>{error}</Text> : null}

      <Pressable
        disabled={isSubmitting || !isValid}
        onPress={() => void handleSubmit()}
        style={[
          styles.primaryButtonFull,
          { backgroundColor: formColors.accent, borderRadius: theme.radii.lg },
          !isValid || isSubmitting ? { opacity: theme.motion.disabledOpacity } : null,
        ]}>
        <Text style={[styles.primaryButtonText, { color: formColors.onAccent }]}>
          {isSubmitting ? '...' : mode === 'signIn' ? t('auth.signIn') : t('auth.signUp')}
        </Text>
      </Pressable>

      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: formColors.border }]} />
        <Text style={[styles.dividerText, { color: formColors.textMuted }]}>{t('auth.or')}</Text>
        <View style={[styles.dividerLine, { backgroundColor: formColors.border }]} />
      </View>

      <Pressable
        disabled={isSubmitting}
        onPress={() => void handleSocialSignIn(onSignInWithGoogle)}
        style={[styles.secondaryButton, { backgroundColor: HERO_NAVY, borderRadius: theme.radii.lg }]}>
        <GoogleIcon size={18} />
        <Text style={styles.secondaryButtonText}>{t('auth.continueGoogle')}</Text>
      </Pressable>
      {Platform.OS !== 'android' ? (
        <Pressable
          disabled={isSubmitting}
          onPress={() => void handleSocialSignIn(onSignInWithApple)}
          style={[styles.secondaryButton, { backgroundColor: HERO_NAVY, borderRadius: theme.radii.lg }]}>
          <AppleIcon size={18} />
          <Text style={styles.secondaryButtonText}>{t('auth.continueApple')}</Text>
        </Pressable>
      ) : null}

      <Pressable onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}>
        <Text style={[styles.switchLink, { color: formColors.secondaryText }]}>
          {mode === 'signIn' ? t('auth.switchToSignUp') : t('auth.switchToSignIn')}
        </Text>
      </Pressable>
    </>
  );

  if (isWeb) {
    return (
      <View style={[styles.webRoot, { backgroundColor: formColors.background }]}>
        <View style={[styles.webHero, { backgroundColor: HERO_NAVY }]}>
          <View style={styles.heroDecorA} />
          <View style={styles.heroDecorB} />
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{heroBadgeText}</Text>
          </View>
          <Text style={styles.webHeroTitle}>{t('auth.webHeroTitle')}</Text>
          <Text style={styles.webHeroSubtitle}>{t('auth.webHeroSubtitle')}</Text>
          <View style={styles.webBulletList}>
            {[t('auth.webHeroBullet1'), t('auth.webHeroBullet2'), t('auth.webHeroBullet3')].map((bullet) => (
              <View key={bullet} style={styles.webBulletRow}>
                <View style={styles.webBulletDot} />
                <Text style={styles.webBulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.webFormPane}>
          <View style={styles.webFormTopRow}>
            <LanguageSwitcher theme={lightTheme} />
          </View>
          <View style={[styles.webFormCard, { backgroundColor: formColors.surface, borderRadius: theme.radii.xl, borderColor: formColors.border }]}>
            <Text style={[styles.title, { color: formColors.text, fontFamily: theme.typography.fontFamily.heading, marginBottom: 0 }]}>{heroTitle}</Text>
            <Text style={[styles.webFormSubtitle, { color: formColors.textMuted }]}>{t('auth.webSubtitle')}</Text>
            {formFields}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: formColors.background }]}>
      <View style={[styles.mobileHero, { backgroundColor: HERO_NAVY }]}>
        <View style={styles.heroDecorA} />
        <View style={styles.heroDecorB} />
        <SafeAreaView edges={['top']} style={styles.heroTopRow}>
          <LanguageSwitcher onDark theme={theme} />
        </SafeAreaView>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>{heroBadgeText}</Text>
        </View>
        <Text style={styles.heroTitle}>{heroTitle}</Text>
        <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.formSheet, { backgroundColor: formColors.surface, borderRadius: theme.radii.sheet }]}
        keyboardShouldPersistTaps="handled">
        {formFields}
      </ScrollView>
    </View>
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
            <Pressable style={[styles.offerBanner, { backgroundColor: HERO_NAVY, borderRadius: theme.radii.xl }]}>
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
  primaryButtonFull: { width: '100%', paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { fontSize: 15, fontWeight: '700' },
  secondaryButton: { width: '100%', paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  secondaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  message: { fontSize: 15, textAlign: 'center' },
  link: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  error: { fontSize: 13 },
  success: { fontSize: 13 },

  fieldLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  fieldInput: { width: '100%', borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 14 },
  passwordInput: { flex: 1, paddingVertical: 12, fontSize: 15 },
  passwordToggle: { fontSize: 13, fontWeight: '700', paddingLeft: 10 },
  forgotRow: { alignSelf: 'flex-end' },
  forgotText: { fontSize: 13, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12 },
  switchLink: { fontSize: 13, fontWeight: '600', marginTop: 8, textAlign: 'center' },

  mobileHero: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 40, overflow: 'hidden' },
  heroTopRow: { position: 'absolute', top: 0, right: 16 },
  heroDecorA: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.06)', top: -80, right: -60 },
  heroDecorB: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,180,0,0.12)', bottom: -120, right: -50 },
  heroBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginBottom: 16 },
  heroBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  heroTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '700' },
  heroSubtitle: { color: '#C9CFDC', fontSize: 14, marginTop: 8, lineHeight: 20 },
  formSheet: { marginTop: -24, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40, gap: 10 },

  webRoot: { flex: 1, flexDirection: 'row', minHeight: '100%' },
  webHero: { flex: 1, minWidth: 320, padding: 56, justifyContent: 'center', overflow: 'hidden' },
  webHeroTitle: { color: '#FFFFFF', fontSize: 34, fontWeight: '700', maxWidth: 420 },
  webHeroSubtitle: { color: '#C9CFDC', fontSize: 15, marginTop: 14, maxWidth: 420, lineHeight: 22 },
  webBulletList: { marginTop: 28, gap: 12 },
  webBulletRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  webBulletDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFB400' },
  webBulletText: { color: '#FFFFFF', fontSize: 14 },
  webFormPane: { flexGrow: 1, flexBasis: 480, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  webFormTopRow: { width: '100%', maxWidth: 380, alignItems: 'flex-end' },
  webFormCard: { width: '100%', maxWidth: 380, borderWidth: 1, padding: 32, gap: 10 },
  webFormSubtitle: { fontSize: 13, marginBottom: 8 },

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
