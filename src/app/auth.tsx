import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AosellLogo } from '@/components/brand/aosell-logo';
import { AppInput } from '@/components/ui/app-input';
import { AppScreen } from '@/components/ui/app-screen';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { translate } from '@/lib/i18n';
import { authSignInSchema, authSignUpSchema } from '@/lib/validations/auth';
import { useAosell } from '@/providers/aosell-provider';

type AuthMode = 'signin' | 'signup';
type AuthRole = 'buyer' | 'seller';
type AuthMethod = 'phone' | 'apple' | 'google';

const authHeroImage = require('../../assets/images/auth-food-hero-v4.png');

function asSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getFriendlyAuthError(error: unknown) {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: unknown }).message)
      : '';

  switch (code) {
    case 'auth/email-already-in-use':
      return translate('auth.errors.emailInUse');
    case 'auth/invalid-email':
      return translate('auth.errors.invalidEmail');
    case 'auth/operation-not-allowed':
      return translate('auth.errors.operationNotAllowed');
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return translate('auth.errors.wrongCredentials');
    case 'auth/network-request-failed':
      return translate('auth.errors.network');
    case 'auth/weak-password':
      return translate('auth.errors.weakPassword');
    case 'auth/too-many-requests':
      return translate('auth.errors.tooManyRequests');
    default:
      return message || translate('auth.errors.generic');
  }
}

export default function AuthScreen() {
  const theme = useTheme();
  const { t } = useLocale();
  const params = useLocalSearchParams<{
    mode?: string | string[];
    role?: string | string[];
    returnTo?: string | string[];
  }>();
  const initialMode = asSingleValue(params.mode) === 'signin' ? 'signin' : 'signup';
  const initialRole = asSingleValue(params.role) === 'seller' ? 'seller' : 'buyer';
  const returnTo = asSingleValue(params.returnTo);
  const { authReady, currentUser, signIn, signUp } = useAosell();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [role, setRole] = useState<AuthRole>(initialRole);
  const [showEmailForm, setShowEmailForm] = useState(Boolean(returnTo));
  const [phoneDraft, setPhoneDraft] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authReady && currentUser && returnTo) {
      router.replace(returnTo as never);
    }
  }, [authReady, currentUser, returnTo]);

  useEffect(() => setMode(initialMode), [initialMode]);
  useEffect(() => setRole(initialRole), [initialRole]);

  async function handleSubmit() {
    setError('');
    setInfo('');
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        const parsed = authSignUpSchema.safeParse({ firstName, lastName, email, password, role });

        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? t('auth.errors.invalidAccountDetails'));
          return;
        }

        await signUp(parsed.data);
        router.replace(
          (returnTo || (parsed.data.role === 'seller' ? '/seller-onboarding' : '/home')) as never,
        );
        return;
      }

      const parsed = authSignInSchema.safeParse({ email, password });

      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? t('auth.errors.invalidCredentials'));
        return;
      }

      await signIn(parsed.data);
      router.replace((returnTo || '/home') as never);
    } catch (nextError) {
      setError(getFriendlyAuthError(nextError));
    } finally {
      setIsSubmitting(false);
    }
  }

  function revealEmailForm(nextMode?: AuthMode) {
    if (nextMode) {
      setMode(nextMode);
    }
    setShowEmailForm(true);
    setInfo('');
    setError('');
  }

  function handleUnavailable(method: AuthMethod) {
    setShowEmailForm(true);
    setInfo(
      method === 'phone'
        ? t('auth.phoneInfo')
        : method === 'apple'
          ? t('auth.appleInfo')
          : t('auth.googleInfo'),
    );
  }

  return (
    <AppScreen padded={false}>
      <View style={[styles.page, { backgroundColor: theme.background }]}>
        <View style={[styles.shell, { backgroundColor: theme.backgroundElement }]}>
          <View style={[styles.artStage, { backgroundColor: theme.backgroundElement }]}>
            <Image
              contentFit="cover"
              source={authHeroImage}
              style={StyleSheet.absoluteFillObject}
              transition={300}
            />
            <PromoBadge style={styles.promoTop} />
            <PromoBadge style={styles.promoMiddle} />
            <PromoBadge style={styles.promoBottom} />
            <View style={styles.heroBrand}>
              <AosellLogo compact />
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.titleRow}>
              <ThemedText type="title" style={styles.title}>
                {t('auth.title')}
              </ThemedText>
              <LanguageSwitcher compact />
            </View>

            <View style={styles.phoneRow}>
              <Pressable style={[styles.countryButton, { backgroundColor: theme.background }]}>
                <GermanFlag />
                <SymbolView
                  tintColor={theme.text}
                  size={17}
                  name={{ ios: 'chevron.down', android: 'arrow_drop_down', web: 'arrow_drop_down' }}
                />
              </Pressable>
              <View style={[styles.phoneField, { backgroundColor: theme.background }]}>
                <TextInput
                  inputMode="tel"
                  keyboardType="phone-pad"
                  onChangeText={setPhoneDraft}
                  placeholder={t('auth.phonePlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.phoneInput, { color: theme.text }]}
                  textContentType="telephoneNumber"
                  value={phoneDraft}
                />
                <SymbolView
                  tintColor={theme.text}
                  size={27}
                  name={{
                    ios: 'person.crop.circle.badge.plus',
                    android: 'person_add',
                    web: 'person_add',
                  }}
                />
              </View>
            </View>

            <Pressable
              onPress={() => handleUnavailable('phone')}
              style={({ pressed }) => [
                styles.continueButton,
                { backgroundColor: theme.earth },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="headline" style={styles.continueText}>
                {t('common.continue')}
              </ThemedText>
            </Pressable>

            {info ? (
              <View style={[styles.infoBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <ThemedText type="bodySmall" themeColor="burntOrange">
                  {info}
                </ThemedText>
              </View>
            ) : null}

            <DividerLabel />

            <View style={styles.optionList}>
              <AuthOptionButton
                label={t('auth.apple')}
                type="apple"
                onPress={() => handleUnavailable('apple')}
              />
              <AuthOptionButton
                label={t('auth.google')}
                type="google"
                onPress={() => handleUnavailable('google')}
              />
              <AuthOptionButton
                label={t('auth.email')}
                type="email"
                onPress={() => revealEmailForm(initialMode)}
              />
            </View>

            {showEmailForm ? (
              <View style={[styles.emailCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <View style={styles.modeTabs}>
                  {(['signup', 'signin'] as const).map((nextMode) => {
                    const active = nextMode === mode;
                    return (
                      <Pressable
                        key={nextMode}
                        onPress={() => {
                          setMode(nextMode);
                          setError('');
                        }}
                        style={[
                          styles.modeTab,
                          { backgroundColor: active ? theme.earth : theme.backgroundElement },
                        ]}>
                        <ThemedText type="button" style={{ color: active ? '#FFFFFF' : theme.text }}>
                          {nextMode === 'signup' ? t('common.createAccount') : t('common.signIn')}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>

                {mode === 'signup' ? (
                  <>
                    <View style={styles.roleRow}>
                      {(['buyer', 'seller'] as const).map((nextRole) => {
                        const active = nextRole === role;
                        return (
                          <Pressable
                            key={nextRole}
                            onPress={() => setRole(nextRole)}
                            style={[
                              styles.roleCard,
                              {
                                backgroundColor: theme.backgroundElement,
                                borderColor: active ? theme.earth : theme.border,
                                borderWidth: active ? 2 : 1,
                              },
                            ]}>
                            <ThemedText type="button">
                              {nextRole === 'buyer' ? t('auth.buyer') : t('auth.seller')}
                            </ThemedText>
                            <ThemedText type="bodySmall" themeColor="textSecondary">
                              {nextRole === 'buyer' ? t('auth.buyerHint') : t('auth.sellerHint')}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>
                    <View style={styles.inlineFields}>
                      <View style={styles.field}>
                        <AppInput
                          autoCapitalize="words"
                          autoCorrect={false}
                          label={t('auth.firstName')}
                          onChangeText={setFirstName}
                          placeholder="Amina"
                          textContentType="givenName"
                          value={firstName}
                        />
                      </View>
                      <View style={styles.field}>
                        <AppInput
                          autoCapitalize="words"
                          autoCorrect={false}
                          label={t('auth.lastName')}
                          onChangeText={setLastName}
                          placeholder="Diallo"
                          textContentType="familyName"
                          value={lastName}
                        />
                      </View>
                    </View>
                  </>
                ) : null}

                <AppInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  inputMode="email"
                  keyboardType="email-address"
                  label={t('auth.emailLabel')}
                  onChangeText={setEmail}
                  placeholder="you@aosell.com"
                  textContentType="emailAddress"
                  value={email}
                />
                <AppInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  label={t('auth.passwordLabel')}
                  onChangeText={setPassword}
                  placeholder={t('auth.passwordPlaceholder')}
                  secureTextEntry
                  textContentType="password"
                  value={password}
                />

                {error ? (
                  <ThemedText type="bodySmall" themeColor="error">
                    {error}
                  </ThemedText>
                ) : null}

                <Pressable
                  disabled={isSubmitting}
                  onPress={() => void handleSubmit()}
                  style={[
                    styles.continueButton,
                    { backgroundColor: theme.earth },
                    isSubmitting && styles.disabled,
                  ]}>
                  <ThemedText type="headline" style={styles.continueText}>
                    {mode === 'signup' ? t('common.createAccount') : t('common.signIn')}
                  </ThemedText>
                </Pressable>
              </View>
            ) : null}

            <Pressable
              onPress={() => setShowEmailForm((current) => !current)}
              style={styles.moreButton}>
              <ThemedText type="headline" style={{ color: theme.text }}>
                {showEmailForm ? t('auth.hideMore') : t('auth.showMore')}
              </ThemedText>
            </Pressable>

            <DividerLabel />

            <Pressable
              onPress={() => revealEmailForm('signin')}
              style={styles.findAccountButton}>
              <SymbolView
                tintColor={theme.text}
                size={24}
                name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
              />
              <ThemedText type="headline" style={{ color: theme.text }}>
                {t('auth.findAccount')}
              </ThemedText>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/home')}
              style={({ pressed }) => [
                styles.guestButton,
                { borderColor: theme.earth },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="headline" style={[styles.guestButtonText, { color: theme.text }]}>
                {t('auth.continueAsGuest')}
              </ThemedText>
              <View
                style={[
                  styles.guestButtonIcon,
                  { borderColor: theme.earth, backgroundColor: theme.backgroundElement },
                ]}>
                <SymbolView
                  tintColor={theme.text}
                  size={20}
                  name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
                />
              </View>
            </Pressable>

            <ThemedText type="bodySmall" themeColor="textSecondary" style={styles.legalCopy}>
              {t('auth.legal')}
            </ThemedText>
          </View>
        </View>
      </View>
    </AppScreen>
  );
}

function DividerLabel() {
  const theme = useTheme();
  const { t } = useLocale();

  return (
    <View style={styles.dividerRow}>
      <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
      <ThemedText type="body" themeColor="textSecondary">
        {t('common.or')}
      </ThemedText>
      <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
    </View>
  );
}

function GermanFlag() {
  return (
    <View style={styles.flag}>
      <View style={[styles.flagStripe, styles.flagBlack]} />
      <View style={[styles.flagStripe, styles.flagRed]} />
      <View style={[styles.flagStripe, styles.flagGold]} />
    </View>
  );
}

function PromoBadge({ style }: { style: object }) {
  const theme = useTheme();

  return (
    <View style={[styles.discountTag, { backgroundColor: theme.burntOrange }, style]}>
      <ThemedText type="headline" style={styles.discountText}>
        %
      </ThemedText>
    </View>
  );
}

function AuthOptionButton({
  label,
  onPress,
  type,
}: {
  label: string;
  onPress: () => void;
  type: 'apple' | 'google' | 'email';
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionButton,
        { backgroundColor: theme.background },
        pressed && styles.pressed,
      ]}>
      <View style={styles.optionIcon}>
        {type === 'email' ? (
          <SymbolView
            tintColor={theme.text}
            size={25}
            name={{ ios: 'envelope', android: 'mail', web: 'mail' }}
          />
        ) : (
          <ThemedText
            type="headline"
            style={[{ color: theme.text }, type === 'google' && styles.googleLetter]}>
            {type === 'google' ? 'G' : 'A'}
          </ThemedText>
        )}
      </View>
      <ThemedText type="headline" style={{ color: theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    minHeight: '100%',
    alignItems: 'center',
  },
  shell: {
    width: '100%',
    maxWidth: 480,
  },
  artStage: {
    height: 320,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBrand: {
    position: 'absolute',
    left: Spacing.lg,
    top: Spacing.lg,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingVertical: 6,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  discountTag: {
    position: 'absolute',
    minWidth: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  promoTop: {
    right: 24,
    top: 58,
  },
  promoMiddle: {
    left: 20,
    top: 150,
  },
  promoBottom: {
    right: 30,
    bottom: 28,
  },
  discountText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  content: {
    width: '90%',
    alignSelf: 'center',
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  titleRow: {
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  title: {
    width: '100%',
    fontSize: 30,
    lineHeight: 36,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  countryButton: {
    width: 116,
    minHeight: 64,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flag: {
    width: 42,
    height: 28,
    borderRadius: 2,
    overflow: 'hidden',
  },
  flagStripe: {
    flex: 1,
    width: '100%',
  },
  flagBlack: {
    backgroundColor: '#111111',
  },
  flagRed: {
    backgroundColor: '#DD1E2F',
  },
  flagGold: {
    backgroundColor: '#F3C300',
  },
  phoneField: {
    flex: 1,
    minWidth: 0,
    minHeight: 64,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  phoneInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 60,
    fontSize: 18,
  },
  continueButton: {
    minHeight: 64,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '500',
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: Radius.small,
    padding: Spacing.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  optionList: {
    gap: Spacing.md,
  },
  optionButton: {
    minHeight: 64,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  optionIcon: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLetter: {
    color: '#4285F4',
    fontWeight: '800',
  },
  moreButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailCard: {
    borderRadius: Radius.large,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modeTabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modeTab: {
    flex: 1,
    minHeight: 46,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  roleCard: {
    flexBasis: 160,
    flexGrow: 1,
    borderRadius: Radius.medium,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  inlineFields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  field: {
    flexBasis: 180,
    flexGrow: 1,
  },
  findAccountButton: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  guestButton: {
    minHeight: 62,
    borderWidth: 1.5,
    borderRadius: Radius.medium,
    backgroundColor: '#FFF1D2',
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  guestButtonText: {
    flexShrink: 1,
  },
  guestButtonIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legalCopy: {
    lineHeight: 20,
    marginTop: Spacing.lg,
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.45,
  },
});
