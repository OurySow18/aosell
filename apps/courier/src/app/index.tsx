import { CourierRepository, OrderRepository } from '@aosell/core';
import type { AppUser, Order } from '@aosell/core';
import * as Location from 'expo-location';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCourierAuth } from '@/providers/courier-auth';

export default function CourierHomeScreen() {
  const { isLoading, currentUser, courierProfile, signUp, signIn, signOut } = useCourierAuth();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    return <AuthForm onSignIn={signIn} onSignUp={signUp} />;
  }

  if (!courierProfile) {
    return <OnboardingForm user={currentUser} />;
  }

  if (courierProfile.verificationStatus !== 'verified') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.message}>
          Compte en attente de validation par l'équipe AoSell ({courierProfile.verificationStatus}).
        </Text>
        <Pressable onPress={() => void signOut()}>
          <Text style={styles.link}>Se déconnecter</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return <Dashboard courierId={courierProfile.id} availability={courierProfile.availability} onSignOut={signOut} />;
}

function AuthForm({
  onSignIn,
  onSignUp,
}: {
  onSignIn: (input: { email: string; password: string }) => Promise<void>;
  onSignUp: (input: { email: string; password: string }) => Promise<void>;
}) {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError('');
    setIsSubmitting(true);
    try {
      if (mode === 'signIn') {
        await onSignIn({ email, password });
      } else {
        await onSignUp({ email, password });
      }
    } catch {
      setError(mode === 'signIn' ? 'Email ou mot de passe invalide.' : "Impossible de créer le compte.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.center}>
      <Text style={styles.title}>AoSell Courier</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="Email"
        style={styles.input}
        value={email}
      />
      <TextInput
        onChangeText={setPassword}
        placeholder="Mot de passe"
        secureTextEntry
        style={styles.input}
        value={password}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable disabled={isSubmitting} onPress={() => void handleSubmit()} style={styles.button}>
        <Text style={styles.buttonText}>
          {isSubmitting ? '...' : mode === 'signIn' ? 'Se connecter' : "Créer un compte"}
        </Text>
      </Pressable>
      <Pressable onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}>
        <Text style={styles.link}>
          {mode === 'signIn' ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

function OnboardingForm({ user }: { user: AppUser }) {
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
      await CourierRepository.create(user, {
        displayName,
        phoneNumber,
        city,
        countryCode,
        vehicleType: vehicleType || undefined,
      });
    } catch {
      setError("Impossible d'enregistrer le profil.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.center}>
      <Text style={styles.title}>Devenir livreur</Text>
      <TextInput onChangeText={setDisplayName} placeholder="Nom complet" style={styles.input} value={displayName} />
      <TextInput onChangeText={setPhoneNumber} placeholder="Téléphone" style={styles.input} value={phoneNumber} />
      <TextInput onChangeText={setCity} placeholder="Ville" style={styles.input} value={city} />
      <TextInput
        autoCapitalize="characters"
        onChangeText={setCountryCode}
        placeholder="Pays (ex: SN)"
        style={styles.input}
        value={countryCode}
      />
      <TextInput onChangeText={setVehicleType} placeholder="Véhicule (moto, vélo...)" style={styles.input} value={vehicleType} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable disabled={isSubmitting} onPress={() => void handleSubmit()} style={styles.button}>
        <Text style={styles.buttonText}>{isSubmitting ? '...' : 'Envoyer'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function Dashboard({
  courierId,
  availability,
  onSignOut,
}: {
  courierId: string;
  availability: string;
  onSignOut: () => Promise<void>;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    return OrderRepository.subscribeForCourier(courierId, setOrders);
  }, [courierId]);

  const offeredOrder = orders.find((order) => order.courierAssignmentStatus === 'offered');
  const activeOrder = orders.find(
    (order) => order.courierAssignmentStatus === 'accepted' && order.status !== 'delivered' && order.status !== 'canceled'
  );

  async function handleToggleAvailability() {
    setLocationError('');
    setIsTogglingAvailability(true);
    try {
      if (availability === 'available') {
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
      setIsTogglingAvailability(false);
    }
  }

  return (
    <SafeAreaView style={styles.dashboard}>
      <View style={styles.dashboardTop}>
        <Text style={styles.title}>AoSell Courier</Text>
        <Pressable onPress={() => void onSignOut()}>
          <Text style={styles.link}>Déconnexion</Text>
        </Pressable>
      </View>

      <Pressable
        disabled={isTogglingAvailability}
        onPress={() => void handleToggleAvailability()}
        style={[styles.button, availability === 'available' ? styles.buttonOn : styles.buttonOff]}>
        <Text style={styles.buttonText}>
          {availability === 'available' ? 'Disponible — passer hors ligne' : 'Hors ligne — passer disponible'}
        </Text>
      </Pressable>
      {locationError ? <Text style={styles.error}>{locationError}</Text> : null}

      <ScrollView style={styles.scroll}>
        {offeredOrder ? <OfferedOrderCard order={offeredOrder} /> : null}
        {activeOrder ? <ActiveOrderCard order={activeOrder} /> : null}
        {!offeredOrder && !activeOrder ? <Text style={styles.message}>Aucune livraison en cours.</Text> : null}
      </ScrollView>

      <Link href="/history" style={styles.link}>
        Historique des livraisons
      </Link>
    </SafeAreaView>
  );
}

function OfferedOrderCard({ order }: { order: Order }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Nouvelle livraison proposée</Text>
      <Text style={styles.message}>
        {(order.total.amountCents / 100).toFixed(2)} {order.currency} — {order.deliveryAddress.city}
      </Text>
      <View style={styles.cardActions}>
        <Pressable
          onPress={() => void OrderRepository.respondToAssignment(order, true)}
          style={[styles.button, styles.buttonOn]}>
          <Text style={styles.buttonText}>Accepter</Text>
        </Pressable>
        <Pressable
          onPress={() => void OrderRepository.respondToAssignment(order, false)}
          style={[styles.button, styles.buttonOff]}>
          <Text style={styles.buttonText}>Refuser</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ActiveOrderCard({ order }: { order: Order }) {
  const nextStatus = order.status === 'preparing' ? 'out_for_delivery' : order.status === 'out_for_delivery' ? 'delivered' : null;
  const nextLabel = order.status === 'preparing' ? 'Marquer comme récupérée' : "Marquer comme livrée";

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Commande en cours — {order.status}</Text>
      <Text style={styles.message}>
        {(order.total.amountCents / 100).toFixed(2)} {order.currency} — {order.deliveryAddress.line1},{' '}
        {order.deliveryAddress.city}
      </Text>
      {nextStatus ? (
        <Pressable onPress={() => void OrderRepository.advanceStatus(order, nextStatus)} style={[styles.button, styles.buttonOn]}>
          <Text style={styles.buttonText}>{nextLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  dashboard: { flex: 1, padding: 16, gap: 12 },
  dashboardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scroll: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700' },
  input: {
    width: 280,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  button: { borderRadius: 6, paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center' },
  buttonOn: { backgroundColor: '#1B8A3A' },
  buttonOff: { backgroundColor: '#B00020' },
  buttonText: { color: '#FFFFFF', fontWeight: '600' },
  message: { fontSize: 14, color: '#444444' },
  link: { color: '#1A73E8', marginTop: 8 },
  error: { color: '#B00020', fontSize: 13 },
  card: { borderWidth: 1, borderColor: '#EDEDED', borderRadius: 8, padding: 12, gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardActions: { flexDirection: 'row', gap: 8 },
});
