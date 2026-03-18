import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AosellLogo } from '@/components/brand/aosell-logo';
import { ThemedText } from '@/components/themed-text';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { AppInput } from '@/components/ui/app-input';
import { AppScreen } from '@/components/ui/app-screen';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { translate } from '@/lib/i18n';
import { authSignInSchema, authSignUpSchema } from '@/lib/validations/auth';
import { useAosell } from '@/providers/aosell-provider';

type AuthMode = 'signin' | 'signup';
type AuthRole = 'buyer' | 'seller';

const artworkItems = [
  {
    id: 'pizza',
    discount: true,
    imageSize: 94,
    left: -30,
    top: 58,
    uri: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=480&q=80',
  },
  {
    id: 'burger',
    discount: true,
    imageSize: 126,
    left: 122,
    top: 102,
    uri: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=480&q=80',
  },
  {
    id: 'avocado',
    discount: true,
    imageSize: 104,
    right: -22,
    top: 54,
    uri: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=480&q=80',
  },
  {
    id: 'bowl',
    discount: true,
    imageSize: 108,
    left: -6,
    top: 250,
    uri: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=480&q=80',
  },
  {
    id: 'tacos',
    imageSize: 106,
    right: 8,
    top: 278,
    uri: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=480&q=80',
  },
];

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
  const initialShowEmailForm = Boolean(asSingleValue(params.mode) || returnTo);
  const { authReady, currentUser, signIn, signUp } = useAosell();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [role, setRole] = useState<AuthRole>(initialRole);
  const [showEmailForm, setShowEmailForm] = useState(initialShowEmailForm);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authReady || !currentUser || !returnTo) {
      return;
    }

    router.replace(returnTo);
  }, [authReady, currentUser, returnTo]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);

  async function handleSubmit() {
    setError('');
    setInfo('');
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        const parsed = authSignUpSchema.safeParse({
          firstName,
          lastName,
          email,
          password,
          role,
        });

        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? t('auth.errors.invalidAccountDetails'));
          return;
        }

        await signUp(parsed.data);
        router.replace(returnTo || (parsed.data.role === 'seller' ? '/seller-onboarding' : '/home'));
        return;
      }

      const parsed = authSignInSchema.safeParse({
        email,
        password,
      });

      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? t('auth.errors.invalidCredentials'));
        return;
      }

      await signIn(parsed.data);
      router.replace(returnTo || '/home');
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
  }

  function handleUnavailable(method: 'phone' | 'apple' | 'google') {
    setShowEmailForm(true);
    setInfo(
      method === 'phone'
        ? t('auth.phoneInfo')
        : method === 'apple'
          ? t('auth.appleInfo')
          : t('auth.googleInfo')
    );
  }

  return (
    <AppScreen padded={false}>
      <View style={[styles.page, { backgroundColor: theme.background }]}>
        <View style={styles.heroShell}>
          <View style={[styles.deliveryPill, { backgroundColor: theme.earth }]}>
            <SymbolView
              tintColor={theme.success}
              size={18}
              name={{ ios: 'phone.fill', android: 'call', web: 'phone.fill' }}
            />
            <ThemedText type="headline" style={{ color: theme.success, fontSize: 18, lineHeight: 22 }}>
              33 min
            </ThemedText>
          </View>

          <View style={styles.artStage}>
            {artworkItems.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.artItem,
                  {
                    left: item.left,
                    right: item.right,
                    top: item.top,
                  },
                ]}>
                <View
                  style={[
                    styles.bloomOutline,
                    { borderColor: theme.gold },
                    index % 2 ? styles.bloomRotateA : styles.bloomRotateB,
                  ]}
                />
                {item.discount ? (
                  <View style={[styles.discountTag, { backgroundColor: theme.error }]}>
                    <ThemedText type="button" style={{ color: '#FFFFFF' }}>
                      %
                    </ThemedText>
                  </View>
                ) : null}
                <View
                  style={[
                    styles.foodFrame,
                    {
                      borderRadius: item.imageSize / 2,
                      height: item.imageSize,
                      width: item.imageSize,
                    },
                  ]}>
                  <Image contentFit="cover" source={{ uri: item.uri }} style={styles.foodImage} transition={250} />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.content}>
          <View style={[styles.brandRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <AosellLogo compact />
          </View>

          <LanguageSwitcher />

          <View style={styles.titleBlock}>
            <ThemedText type="title">{t('auth.title')}</ThemedText>
            <ThemedText type="body" themeColor="textSecondary">
              {t('auth.subtitle')}
            </ThemedText>
          </View>

          <View style={styles.phoneRow}>
            <Pressable
              style={[
                styles.countryButton,
                { backgroundColor: theme.backgroundSelected, borderColor: theme.border },
              ]}>
              <ThemedText type="headline">DE</ThemedText>
              <SymbolView
                tintColor={theme.text}
                size={16}
                name={{ ios: 'chevron.down', android: 'arrow_drop_down', web: 'chevron.down' }}
              />
            </Pressable>
            <View
              style={[
                styles.phoneField,
                { backgroundColor: theme.backgroundSelected, borderColor: theme.border },
              ]}>
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
              <View style={styles.phoneBadge}>
                <SymbolView
                  tintColor={theme.text}
                  size={22}
                  name={{ ios: 'person.crop.circle.badge.plus', android: 'person_add', web: 'person.crop.circle.badge.plus' }}
                />
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => handleUnavailable('phone')}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: theme.earth },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="headline" style={{ color: theme.background, fontSize: 18, lineHeight: 22 }}>
              {t('common.continue')}
            </ThemedText>
          </Pressable>

          {info ? (
            <ThemedText type="bodySmall" themeColor="burntOrange">
              {info}
            </ThemedText>
          ) : null}

          <DividerLabel />

          <View style={styles.optionList}>
            <AuthOptionButton label={t('auth.apple')} type="apple" onPress={() => handleUnavailable('apple')} />
            <AuthOptionButton label={t('auth.google')} type="google" onPress={() => handleUnavailable('google')} />
            <AuthOptionButton label={t('auth.email')} type="email" onPress={() => revealEmailForm(initialMode)} />
          </View>

          <Pressable
            onPress={() => setShowEmailForm((current) => !current)}
            style={styles.moreButton}>
            <ThemedText type="button">{showEmailForm ? t('auth.hideMore') : t('auth.showMore')}</ThemedText>
          </Pressable>

          {showEmailForm ? (
            <View style={[styles.emailCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
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
                        {
                          backgroundColor: active ? theme.earth : theme.background,
                          borderColor: active ? theme.earth : theme.border,
                        },
                      ]}>
                      <ThemedText type="button" style={{ color: active ? '#FFFFFF' : theme.text }}>
                        {nextMode === 'signup' ? t('common.createAccount') : t('common.signIn')}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              {returnTo ? (
                <ThemedText type="bodySmall" themeColor="textSecondary">
                  {t('auth.returnToPrevious')}
                </ThemedText>
              ) : null}

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
                              backgroundColor: active ? theme.background : theme.backgroundElement,
                              borderColor: active ? theme.earth : theme.border,
                            },
                          ]}>
                          <ThemedText type="button">
                            {nextRole === 'buyer' ? t('auth.buyer') : t('auth.seller')}
                          </ThemedText>
                          <ThemedText type="bodySmall" themeColor="textSecondary">
                            {nextRole === 'buyer'
                              ? t('auth.buyerHint')
                              : t('auth.sellerHint')}
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
                onPress={() => {
                  void handleSubmit();
                }}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: theme.earth },
                  isSubmitting && styles.disabled,
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="headline" style={{ color: theme.background, fontSize: 18, lineHeight: 22 }}>
                  {mode === 'signup' ? t('common.createAccount') : t('common.signIn')}
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => router.replace(returnTo || '/home')}
                style={styles.secondaryTextButton}>
                <ThemedText type="button">
                  {returnTo ? t('auth.backToPrevious') : t('auth.continueExploring')}
                </ThemedText>
              </Pressable>
            </View>
          ) : null}

          <DividerLabel />

          <Pressable
            onPress={() => {
              revealEmailForm('signin');
              setEmail('');
              setPassword('');
            }}
            style={styles.findAccountButton}>
            <SymbolView
              tintColor={theme.text}
              size={22}
              name={{ ios: 'magnifyingglass', android: 'search', web: 'magnifyingglass' }}
            />
            <ThemedText type="headline">{t('auth.findAccount')}</ThemedText>
          </Pressable>

          <ThemedText type="bodySmall" themeColor="textSecondary" style={styles.legalCopy}>
            {t('auth.legal')}
          </ThemedText>
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
        { backgroundColor: theme.backgroundSelected, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={styles.optionIcon}>
        {type === 'email' ? (
          <SymbolView
            tintColor={theme.text}
            size={22}
            name={{ ios: 'envelope', android: 'mail', web: 'envelope' }}
          />
        ) : (
          <View
            style={[
              styles.letterBadge,
              { backgroundColor: type === 'google' ? '#FFFFFF' : theme.earth },
            ]}>
            <ThemedText
              type="button"
              style={{ color: type === 'google' ? '#4285F4' : '#FFFFFF' }}>
              {type === 'google' ? 'G' : 'A'}
            </ThemedText>
          </View>
        )}
      </View>
      <ThemedText type="headline" style={styles.optionLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    minHeight: '100%',
  },
  heroShell: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
  },
  deliveryPill: {
    alignSelf: 'center',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minWidth: 180,
    justifyContent: 'center',
  },
  artStage: {
    height: 360,
    position: 'relative',
    overflow: 'hidden',
  },
  artItem: {
    position: 'absolute',
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloomOutline: {
    position: 'absolute',
    width: 178,
    height: 178,
    borderWidth: 3,
    borderRadius: 58,
    opacity: 0.8,
  },
  bloomRotateA: {
    transform: [{ rotate: '18deg' }],
  },
  bloomRotateB: {
    transform: [{ rotate: '-14deg' }],
  },
  foodFrame: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  discountTag: {
    position: 'absolute',
    top: 22,
    left: 28,
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    zIndex: 2,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl + 28,
    gap: Spacing.lg,
  },
  brandRow: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Radius.large,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  titleBlock: {
    gap: Spacing.sm,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'stretch',
  },
  countryButton: {
    minWidth: 104,
    borderWidth: 1,
    borderRadius: Radius.large,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  phoneField: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.large,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.md,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
  },
  phoneBadge: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    borderRadius: Radius.large,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  optionList: {
    gap: Spacing.md,
  },
  optionButton: {
    minHeight: 64,
    borderRadius: Radius.large,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  optionIcon: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 20,
    lineHeight: 24,
  },
  moreButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  emailCard: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modeTabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modeTab: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.pill,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  roleRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  roleCard: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.md,
    gap: Spacing.xs,
    flexBasis: 160,
    flexGrow: 1,
  },
  inlineFields: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  field: {
    flexBasis: 180,
    flexGrow: 1,
  },
  secondaryTextButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
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
  findAccountButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  legalCopy: {
    textAlign: 'center',
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.992 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
