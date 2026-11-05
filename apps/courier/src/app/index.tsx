import { CourierRepository } from '@aosell/core';
import * as Location from 'expo-location';
import { Link, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/bottom-nav';
import { MapBackdrop } from '@/components/map-backdrop';
import { useAppTheme } from '@/hooks/use-theme';
import { useCourierAuth } from '@/providers/courier-auth';
import { useCourierOrders } from '@/providers/courier-orders';
import type { AppUser } from '@aosell/core';

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export default function CourierHomeScreen() {
  const theme = useAppTheme();
  const { isLoading, currentUser, courierProfile, signUp, signIn, signOut } = useCourierAuth();

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.accent} />
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    return <AuthForm onSignIn={signIn} onSignUp={signUp} theme={theme} />;
  }

  if (!courierProfile) {
    return <OnboardingForm theme={theme} user={currentUser} />;
  }

  if (courierProfile.verificationStatus !== 'verified') {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.message, { color: theme.colors.text }]}>
          Compte en attente de validation par l'équipe AoSell ({courierProfile.verificationStatus}).
        </Text>
        <Pressable onPress={() => void signOut()}>
          <Text style={[styles.link, { color: theme.colors.secondaryText }]}>Se déconnecter</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return <Dashboard courierId={courierProfile.id} displayName={courierProfile.displayName} theme={theme} vehicleType={courierProfile.vehicleType} city={courierProfile.city} availability={courierProfile.availability} />;
}

function AuthForm({ onSignIn, onSignUp, theme }: { onSignIn: (i: { email: string; password: string }) => Promise<void>; onSignUp: (i: { email: string; password: string }) => Promise<void>; theme: ReturnType<typeof useAppTheme> }) {
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
      setError(mode === 'signIn' ? 'Email ou mot de passe invalide.' : "Impossible de créer le compte.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.heading }]}>AoSell Livreur</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, borderRadius: theme.radii.lg }]}
        value={email}
      />
      <TextInput
        onChangeText={setPassword}
        placeholder="Mot de passe"
        placeholderTextColor={theme.colors.textMuted}
        secureTextEntry
        style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, borderRadius: theme.radii.lg }]}
        value={password}
      />
      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
      <Pressable disabled={isSubmitting} onPress={() => void handleSubmit()} style={[styles.primaryButton, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.lg }]}>
        <Text style={[styles.primaryButtonText, { color: theme.colors.onAccent }]}>{isSubmitting ? '...' : mode === 'signIn' ? 'Se connecter' : "Créer un compte"}</Text>
      </Pressable>
      <Pressable onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}>
        <Text style={[styles.link, { color: theme.colors.secondaryText }]}>
          {mode === 'signIn' ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

function OnboardingForm({ user, theme }: { user: AppUser; theme: ReturnType<typeof useAppTheme> }) {
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
      setError("Impossible d'enregistrer le profil.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.heading }]}>Devenir livreur</Text>
      <TextInput onChangeText={setDisplayName} placeholder="Nom complet" placeholderTextColor={theme.colors.textMuted} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, borderRadius: theme.radii.lg }]} value={displayName} />
      <TextInput onChangeText={setPhoneNumber} placeholder="Téléphone" placeholderTextColor={theme.colors.textMuted} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, borderRadius: theme.radii.lg }]} value={phoneNumber} />
      <TextInput onChangeText={setCity} placeholder="Ville" placeholderTextColor={theme.colors.textMuted} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, borderRadius: theme.radii.lg }]} value={city} />
      <TextInput autoCapitalize="characters" onChangeText={setCountryCode} placeholder="Pays (ex: SN)" placeholderTextColor={theme.colors.textMuted} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, borderRadius: theme.radii.lg }]} value={countryCode} />
      <TextInput onChangeText={setVehicleType} placeholder="Véhicule (moto, vélo...)" placeholderTextColor={theme.colors.textMuted} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, borderRadius: theme.radii.lg }]} value={vehicleType} />
      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
      <Pressable disabled={isSubmitting} onPress={() => void handleSubmit()} style={[styles.primaryButton, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.lg }]}>
        <Text style={[styles.primaryButtonText, { color: theme.colors.onAccent }]}>{isSubmitting ? '...' : 'Envoyer'}</Text>
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
        setLocationError('Autorisation de localisation refusée.');
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
                {online ? 'En ligne' : 'Hors ligne'}
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
                <Text style={styles.offerTitle}>Recherche de courses autour de toi</Text>
                <Text style={styles.offerSubtitle}>1 course proposée · touche pour la voir</Text>
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
          <Text style={[styles.toggleButtonText, { color: theme.colors.text }]}>{online ? 'Passer hors ligne' : 'Passer en ligne'}</Text>
        </Pressable>
        {locationError ? <Text style={[styles.error, { color: theme.colors.error }]}>{locationError}</Text> : null}

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radii.lg }]}>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Gains du jour</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{(gainsTodayCents / 100).toFixed(2)} €</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radii.lg }]}>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Courses</Text>
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
