import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAdminAuth } from '@/providers/admin-auth';

export default function AdminIndexScreen() {
  const { status, signIn, signInWithGoogle, signInWithApple, signOut } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (status === 'admin') {
    return <Redirect href="/orders" />;
  }

  if (status === 'not-admin') {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>
          Ce compte n'a pas accès au dashboard admin.
        </Text>
        <Pressable onPress={() => void signOut()}>
          <Text style={styles.link}>Se déconnecter</Text>
        </Pressable>
      </View>
    );
  }

  async function handleSignIn() {
    setError('');
    setIsSubmitting(true);
    try {
      await signIn(email, password);
    } catch {
      setError('Email ou mot de passe invalide.');
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
      setError('Connexion annulée ou refusée.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.center}>
      <Text style={styles.title}>AoSell Admin</Text>
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
      <Pressable disabled={isSubmitting} onPress={() => void handleSignIn()} style={styles.button}>
        <Text style={styles.buttonText}>{isSubmitting ? '...' : 'Se connecter'}</Text>
      </Pressable>

      <Text style={styles.or}>ou</Text>

      <Pressable
        disabled={isSubmitting}
        onPress={() => void handleSocialSignIn(signInWithGoogle)}
        style={[styles.button, styles.socialButton]}>
        <Text style={styles.buttonText}>Continuer avec Google</Text>
      </Pressable>
      <Pressable
        disabled={isSubmitting}
        onPress={() => void handleSocialSignIn(signInWithApple)}
        style={[styles.button, styles.socialButton]}>
        <Text style={styles.buttonText}>Continuer avec Apple</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  input: {
    width: 280,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  button: { backgroundColor: '#1A1A1A', borderRadius: 6, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8, width: 280, alignItems: 'center' },
  socialButton: { backgroundColor: '#3C4043' },
  buttonText: { color: '#FFFFFF', fontWeight: '600' },
  or: { color: '#888888', fontSize: 12, marginTop: 4 },
  message: { fontSize: 15, textAlign: 'center' },
  link: { color: '#1A73E8', marginTop: 8 },
  error: { color: '#B00020', fontSize: 13 },
});
