import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AdminLogo } from '@/components/admin-logo';
import { LanguageSwitcher } from '@/components/language-switcher';
import { AppleIcon, GoogleIcon } from '@/components/social-icons';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/lib/i18n';
import { useAdminAuth } from '@/providers/admin-auth';

export default function AdminIndexScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const { status, signIn, signInWithGoogle, signInWithApple, signOut } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (status === 'loading') {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  if (status === 'admin') {
    return <Redirect href="/dashboard" />;
  }

  if (status === 'not-admin') {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
          <AdminLogo theme={theme} />
          <Text style={[styles.message, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.body }]}>
            {t('auth.noAccess')}
          </Text>
          <Pressable onPress={() => void signOut()}>
            <Text style={[styles.link, { color: theme.colors.secondaryText, fontFamily: theme.typography.fontFamily.bodySemi }]}>
              {t('sidebar.signOut')}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  async function handleSignIn() {
    setError('');
    setIsSubmitting(true);
    try {
      await signIn(email, password);
    } catch {
      setError(t('auth.signInError'));
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
    <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
        <View style={styles.cardTop}>
          <AdminLogo theme={theme} />
          <LanguageSwitcher theme={theme} />
        </View>

        <View style={styles.form}>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder={t('auth.email')}
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.input,
              { borderColor: theme.colors.border, borderRadius: theme.radii.lg, color: theme.colors.text, fontFamily: theme.typography.fontFamily.body },
            ]}
            value={email}
          />
          <TextInput
            onChangeText={setPassword}
            placeholder={t('auth.password')}
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry
            style={[
              styles.input,
              { borderColor: theme.colors.border, borderRadius: theme.radii.lg, color: theme.colors.text, fontFamily: theme.typography.fontFamily.body },
            ]}
            value={password}
          />
          {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
          <Pressable
            disabled={isSubmitting}
            onPress={() => void handleSignIn()}
            style={[styles.button, { backgroundColor: theme.colors.text, borderRadius: theme.radii.lg, opacity: isSubmitting ? 0.6 : 1 }]}>
            <Text style={[styles.buttonText, { color: theme.colors.background, fontFamily: theme.typography.fontFamily.bodySemi }]}>
              {isSubmitting ? '...' : t('auth.signIn')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          <Text style={[styles.dividerText, { color: theme.colors.textMuted, fontFamily: theme.typography.fontFamily.body }]}>{t('auth.or')}</Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
        </View>

        <View style={styles.socialRow}>
          <Pressable
            disabled={isSubmitting}
            onPress={() => void handleSocialSignIn(signInWithGoogle)}
            style={[styles.socialButton, { borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
            <GoogleIcon size={16} />
            <Text style={[styles.socialButtonText, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.bodySemi }]}>
              {t('auth.continueGoogle')}
            </Text>
          </Pressable>
          <Pressable
            disabled={isSubmitting}
            onPress={() => void handleSocialSignIn(signInWithApple)}
            style={[styles.socialButton, { borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
            <AppleIcon color={theme.colors.text} size={16} />
            <Text style={[styles.socialButtonText, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.bodySemi }]}>
              {t('auth.continueApple')}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: 360, borderWidth: 1, padding: 28, gap: 24 },
  cardTop: { gap: 12 },
  form: { gap: 12 },
  input: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  button: { paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  buttonText: { fontSize: 15 },
  error: { fontSize: 13 },
  message: { fontSize: 15, textAlign: 'center' },
  link: { fontSize: 14, textAlign: 'center' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12 },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialButton: { flex: 1, borderWidth: 1, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  socialButtonText: { fontSize: 14 },
});
