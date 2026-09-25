import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AosellLogo } from '@/components/brand/aosell-logo';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { translate } from '@/lib/i18n';
import { authSignInSchema, authSignUpSchema } from '@/lib/validations/auth';
import { useAosell } from '@/providers/aosell-provider';

type AppTheme = ReturnType<typeof useAppTheme>;
type AuthMode = 'signin' | 'signup';
type AuthRole = 'buyer' | 'seller';
type AuthMethod = 'phone' | 'apple' | 'google';

// Rotating West African dishes — replaces the earlier pizza/burger/taco placeholder
// that didn't match the app's cuisine. Cycles so the hero shows several kinds of
// dishes (rice, stew, fufu, grilled meat) rather than a single static photo.
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1665332195309-9d75071138f0?auto=format&fit=crop&w=1600&q=80', // jollof rice, grilled fish, skewers
  'https://images.unsplash.com/photo-1603496987674-79600a000f55?auto=format&fit=crop&w=1600&q=80', // roasted chicken on jollof rice
  'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=1600&q=80', // fufu with vegetable soup
  'https://images.unsplash.com/photo-1665400808116-f0e6339b7e9a?auto=format&fit=crop&w=1600&q=80', // jollof rice, plantains, stew spread
  'https://images.unsplash.com/photo-1604329756574-bda1f2cada6f?auto=format&fit=crop&w=1600&q=80', // fried rice with pepper stew
  'https://images.unsplash.com/photo-1638436684761-7e59f8a9072f?auto=format&fit=crop&w=1600&q=80', // rice, fish, eggs, chicken spread
];
const HERO_ROTATION_MS = 4500;

function HeroCarousel({ theme }: { theme: AppTheme }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % HERO_IMAGES.length);
    }, HERO_ROTATION_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Image
        contentFit="cover"
        source={{ uri: HERO_IMAGES[index] }}
        style={StyleSheet.absoluteFillObject}
        transition={600}
      />
      <View style={styles.heroDots}>
        {HERO_IMAGES.map((uri, dotIndex) => (
          <View
            key={uri}
            style={[
              styles.heroDot,
              { backgroundColor: dotIndex === index ? theme.colors.accent : 'rgba(255,255,255,0.55)' },
            ]}
          />
        ))}
      </View>
    </>
  );
}

function asSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getFriendlyAuthError(error: unknown) {
  const code =
    typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: unknown }).code) : '';
  const message =
    typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: unknown }).message) : '';

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
  const theme = useAppTheme();
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
        router.replace((returnTo || (parsed.data.role === 'seller' ? '/seller-onboarding' : '/home')) as never);
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
    setInfo(method === 'phone' ? t('auth.phoneInfo') : method === 'apple' ? t('auth.appleInfo') : t('auth.googleInfo'));
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.shell}>
          <View style={[styles.artStage, { backgroundColor: theme.colors.accentTint }]}>
            <HeroCarousel theme={theme} />
            <PromoBadge style={styles.promoTop} theme={theme} />
            <PromoBadge style={styles.promoMiddle} theme={theme} />
            <PromoBadge style={styles.promoBottom} theme={theme} />
            <View style={styles.heroBrand}>
              <AosellLogo compact />
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.title.fontFamily }]}>
                {t('auth.title')}
              </Text>
              <LanguageSwitcher compact />
            </View>

            <View style={styles.phoneRow}>
              <Pressable
                style={[
                  styles.countryButton,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.md },
                ]}>
                <GermanFlag />
                <SymbolView tintColor={theme.colors.text} size={17} name={{ ios: 'chevron.down', android: 'arrow_drop_down', web: 'arrow_drop_down' }} />
              </Pressable>
              <View
                style={[
                  styles.phoneField,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.md },
                ]}>
                <TextInput
                  inputMode="tel"
                  keyboardType="phone-pad"
                  onChangeText={setPhoneDraft}
                  placeholder={t('auth.phonePlaceholder')}
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.phoneInput, { color: theme.colors.text, fontFamily: theme.typography.body.fontFamily }]}
                  textContentType="telephoneNumber"
                  value={phoneDraft}
                />
                <SymbolView
                  tintColor={theme.colors.textMuted}
                  size={24}
                  name={{ ios: 'person.crop.circle.badge.plus', android: 'person_add', web: 'person_add' }}
                />
              </View>
            </View>

            <Pressable
              onPress={() => handleUnavailable('phone')}
              style={({ pressed }) => [
                styles.continueButton,
                { backgroundColor: theme.colors.accent, borderRadius: theme.radii.md, opacity: pressed ? theme.motion.pressedScale : 1 },
              ]}>
              <Text style={[styles.continueText, { color: theme.colors.onAccent, fontFamily: theme.typography.heading.fontFamily }]}>
                {t('common.continue')}
              </Text>
            </Pressable>

            {info ? (
              <View
                style={[
                  styles.infoBox,
                  { backgroundColor: theme.colors.accentTint, borderColor: theme.colors.accentTintBorder, borderRadius: theme.radii.sm },
                ]}>
                <Text style={[styles.infoText, { color: theme.colors.text }]}>{info}</Text>
              </View>
            ) : null}

            <DividerLabel theme={theme} />

            <View style={styles.optionList}>
              <AuthOptionButton theme={theme} label={t('auth.apple')} type="apple" onPress={() => handleUnavailable('apple')} />
              <AuthOptionButton theme={theme} label={t('auth.google')} type="google" onPress={() => handleUnavailable('google')} />
              <AuthOptionButton theme={theme} label={t('auth.email')} type="email" onPress={() => revealEmailForm(initialMode)} />
            </View>

            {showEmailForm ? (
              <View
                style={[
                  styles.emailCard,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg },
                ]}>
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
                            borderRadius: theme.radii.sm,
                            backgroundColor: active ? theme.colors.text : theme.colors.surfaceMuted,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.modeTabText,
                            { color: active ? '#FFFFFF' : theme.colors.text, fontFamily: theme.typography.label.fontFamily },
                          ]}>
                          {nextMode === 'signup' ? t('common.createAccount') : t('common.signIn')}
                        </Text>
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
                                borderRadius: theme.radii.md,
                                backgroundColor: theme.colors.surfaceMuted,
                                borderColor: active ? theme.colors.text : theme.colors.border,
                                borderWidth: active ? 2 : 1,
                              },
                            ]}>
                            <Text style={[styles.roleCardTitle, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
                              {nextRole === 'buyer' ? t('auth.buyer') : t('auth.seller')}
                            </Text>
                            <Text style={[styles.roleCardHint, { color: theme.colors.textMuted }]}>
                              {nextRole === 'buyer' ? t('auth.buyerHint') : t('auth.sellerHint')}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <View style={styles.inlineFields}>
                      <Field
                        theme={theme}
                        style={styles.field}
                        autoCapitalize="words"
                        autoCorrect={false}
                        label={t('auth.firstName')}
                        onChangeText={setFirstName}
                        placeholder="Amina"
                        textContentType="givenName"
                        value={firstName}
                      />
                      <Field
                        theme={theme}
                        style={styles.field}
                        autoCapitalize="words"
                        autoCorrect={false}
                        label={t('auth.lastName')}
                        onChangeText={setLastName}
                        placeholder="Diallo"
                        textContentType="familyName"
                        value={lastName}
                      />
                    </View>
                  </>
                ) : null}

                <Field
                  theme={theme}
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
                <Field
                  theme={theme}
                  autoCapitalize="none"
                  autoCorrect={false}
                  label={t('auth.passwordLabel')}
                  onChangeText={setPassword}
                  placeholder={t('auth.passwordPlaceholder')}
                  secureTextEntry
                  textContentType="password"
                  value={password}
                />

                {error ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text> : null}

                <Pressable
                  disabled={isSubmitting}
                  onPress={() => void handleSubmit()}
                  style={[
                    styles.continueButton,
                    { backgroundColor: theme.colors.accent, borderRadius: theme.radii.md, opacity: isSubmitting ? theme.motion.disabledOpacity : 1 },
                  ]}>
                  <Text style={[styles.continueText, { color: theme.colors.onAccent, fontFamily: theme.typography.heading.fontFamily }]}>
                    {mode === 'signup' ? t('common.createAccount') : t('common.signIn')}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <Pressable onPress={() => setShowEmailForm((current) => !current)} style={styles.moreButton}>
              <Text style={[styles.moreButtonText, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
                {showEmailForm ? t('auth.hideMore') : t('auth.showMore')}
              </Text>
            </Pressable>

            <DividerLabel theme={theme} />

            <Pressable onPress={() => revealEmailForm('signin')} style={styles.findAccountButton}>
              <SymbolView tintColor={theme.colors.text} size={24} name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} />
              <Text style={[styles.findAccountText, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
                {t('auth.findAccount')}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/home')}
              style={({ pressed }) => [
                styles.guestButton,
                {
                  borderColor: theme.colors.accent,
                  borderRadius: theme.radii.md,
                  backgroundColor: theme.colors.accentTint,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <Text style={[styles.guestButtonText, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
                {t('auth.continueAsGuest')}
              </Text>
              <View
                style={[
                  styles.guestButtonIcon,
                  { borderColor: theme.colors.accent, backgroundColor: theme.colors.surface },
                ]}>
                <SymbolView tintColor={theme.colors.text} size={20} name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} />
              </View>
            </Pressable>

            <Text style={[styles.legalCopy, { color: theme.colors.textMuted }]}>{t('auth.legal')}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DividerLabel({ theme }: { theme: AppTheme }) {
  const { t } = useLocale();

  return (
    <View style={styles.dividerRow}>
      <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
      <Text style={[styles.dividerText, { color: theme.colors.textMuted }]}>{t('common.or')}</Text>
      <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
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

function PromoBadge({ style, theme }: { style: StyleProp<ViewStyle>; theme: AppTheme }) {
  return (
    <View style={[styles.discountTag, { backgroundColor: theme.colors.secondary }, style]}>
      <Text style={[styles.discountText, { fontFamily: theme.typography.heading.fontFamily }]}>%</Text>
    </View>
  );
}

function AuthOptionButton({
  label,
  onPress,
  type,
  theme,
}: {
  label: string;
  onPress: () => void;
  type: 'apple' | 'google' | 'email';
  theme: AppTheme;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionButton,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.md },
        pressed && styles.pressed,
      ]}>
      <View style={styles.optionIcon}>
        {type === 'email' ? (
          <SymbolView tintColor={theme.colors.text} size={25} name={{ ios: 'envelope', android: 'mail', web: 'mail' }} />
        ) : (
          <Text
            style={[
              styles.optionLetter,
              { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily },
              type === 'google' && styles.googleLetter,
            ]}>
            {type === 'google' ? 'G' : 'A'}
          </Text>
        )}
      </View>
      <Text style={[styles.optionLabel, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>{label}</Text>
    </Pressable>
  );
}

function Field({
  theme,
  label,
  style,
  ...inputProps
}: {
  theme: AppTheme;
  label: string;
  style?: StyleProp<ViewStyle>;
} & ComponentProps<typeof TextInput>) {
  return (
    <View style={[styles.fieldWrap, style]}>
      <Text style={[styles.fieldLabel, { color: theme.colors.textMuted, fontFamily: theme.typography.micro.fontFamily }]}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.fieldInput,
          {
            color: theme.colors.text,
            backgroundColor: theme.colors.surfaceMuted,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.md,
            fontFamily: theme.typography.body.fontFamily,
          },
        ]}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  shell: { width: '100%', maxWidth: 480 },
  artStage: { height: 320, position: 'relative', overflow: 'hidden' },
  heroBrand: {
    position: 'absolute',
    left: 20,
    top: 20,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingVertical: 6,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  discountTag: { position: 'absolute', minWidth: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  promoTop: { right: 24, top: 58 },
  promoMiddle: { left: 20, top: 150 },
  promoBottom: { right: 30, bottom: 28 },
  discountText: { color: '#FFFFFF', fontSize: 17, lineHeight: 22 },
  heroDots: { position: 'absolute', left: 0, right: 0, bottom: 14, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  heroDot: { width: 6, height: 6, borderRadius: 3 },
  content: { width: '90%', alignSelf: 'center', paddingBottom: 40, paddingTop: 20, gap: 20 },
  titleRow: { alignItems: 'flex-start', gap: 12 },
  title: { width: '100%', fontSize: 28, lineHeight: 34 },
  phoneRow: { flexDirection: 'row', gap: 8 },
  countryButton: { width: 108, minHeight: 58, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flag: { width: 38, height: 26, borderRadius: 2, overflow: 'hidden' },
  flagStripe: { flex: 1, width: '100%' },
  flagBlack: { backgroundColor: '#111111' },
  flagRed: { backgroundColor: '#DD1E2F' },
  flagGold: { backgroundColor: '#F3C300' },
  phoneField: { flex: 1, minWidth: 0, minHeight: 58, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  phoneInput: { flex: 1, minWidth: 0, minHeight: 54, fontSize: 16 },
  continueButton: { minHeight: 56, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  continueText: { fontSize: 17, lineHeight: 22 },
  infoBox: { borderWidth: 1, padding: 12 },
  infoText: { fontSize: 13, lineHeight: 19 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 14, lineHeight: 20 },
  optionList: { gap: 10 },
  optionButton: { minHeight: 58, borderWidth: 1, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  optionIcon: { width: 30, alignItems: 'center', justifyContent: 'center' },
  optionLetter: { fontSize: 17, lineHeight: 22 },
  googleLetter: { color: '#4285F4' },
  optionLabel: { fontSize: 16, lineHeight: 21 },
  moreButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  moreButtonText: { fontSize: 15, lineHeight: 20 },
  emailCard: { borderWidth: 1, padding: 16, gap: 12 },
  modeTabs: { flexDirection: 'row', gap: 8 },
  modeTab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  modeTabText: { fontSize: 14, lineHeight: 19 },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleCard: { flexBasis: 150, flexGrow: 1, padding: 12, gap: 4 },
  roleCardTitle: { fontSize: 14, lineHeight: 19 },
  roleCardHint: { fontSize: 12, lineHeight: 17 },
  inlineFields: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  field: { flexBasis: 160, flexGrow: 1 },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 11, lineHeight: 14, textTransform: 'uppercase', letterSpacing: 0.2 },
  fieldInput: { minHeight: 50, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 },
  errorText: { fontSize: 13, lineHeight: 18 },
  findAccountButton: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  findAccountText: { fontSize: 16, lineHeight: 21 },
  guestButton: { minHeight: 58, borderWidth: 1.5, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  guestButtonText: { flexShrink: 1, fontSize: 16, lineHeight: 21 },
  guestButtonIcon: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  legalCopy: { fontSize: 12, lineHeight: 18, marginTop: 8 },
  pressed: { opacity: 0.78 },
});
