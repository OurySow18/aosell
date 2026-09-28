import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AosellLogo } from '@/components/brand/aosell-logo';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import type { Locale } from '@/lib/i18n';

type AppTheme = ReturnType<typeof useAppTheme>;

// Demo-only carousel copy (dish · shop · neighborhood) for the welcome screen's
// hero imagery. Only "Saffron Table" is a real demo seller elsewhere in the app;
// the other shop names are illustrative and not backed by real listings.
const WELCOME_SLIDES = [
  { image: 'https://images.unsplash.com/photo-1665332195309-9d75071138f0?auto=format&fit=crop&w=1200&q=80', dish: 'Thieboudienne', place: 'Saffron Table · Viertel' },
  { image: 'https://images.unsplash.com/photo-1603496987674-79600a000f55?auto=format&fit=crop&w=1200&q=80', dish: 'Yassa poulet', place: 'Chez Aminata · Neustadt' },
  { image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=1200&q=80', dish: 'Tibs et injera', place: 'Addis Café · Findorff' },
  { image: 'https://images.unsplash.com/photo-1665400808116-f0e6339b7e9a?auto=format&fit=crop&w=1200&q=80', dish: 'Mafé bœuf', place: 'Saffron Table · Viertel' },
  { image: 'https://images.unsplash.com/photo-1604329756574-bda1f2cada6f?auto=format&fit=crop&w=1200&q=80', dish: 'Épices et attiéké', place: 'Marché Sahel · Walle' },
];

const SLIDE_ROTATION_MS = 3500;
const CAROUSEL_HEIGHT = 372;

const LANGUAGE_OPTIONS: { value: Locale; label: string }[] = [
  { value: 'fr', label: 'FR' },
  { value: 'de', label: 'DE' },
  { value: 'en', label: 'EN' },
];

export default function WelcomeScreen() {
  const theme = useAppTheme();
  const { t, locale, setLocale } = useLocale();
  const breakpoint = useBreakpoint();
  const isWideLayout = Platform.OS === 'web' && breakpoint !== 'mobile';
  const scrollRef = useRef<ScrollView>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [carouselWidth, setCarouselWidth] = useState(Dimensions.get('window').width);
  const [phoneDraft, setPhoneDraft] = useState('');

  useEffect(() => {
    if (isPaused) {
      return;
    }
    const timer = setInterval(() => {
      setSlideIndex((current) => {
        const next = (current + 1) % WELCOME_SLIDES.length;
        scrollRef.current?.scrollTo({ x: next * carouselWidth, animated: true });
        return next;
      });
    }, SLIDE_ROTATION_MS);
    return () => clearInterval(timer);
  }, [isPaused, carouselWidth]);

  function handleMomentumEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / carouselWidth);
    setSlideIndex(nextIndex);
    setIsPaused(false);
  }

  const isPhoneValid = phoneDraft.replace(/\D/g, '').length >= 6;

  function goToAuth(mode: 'signup' | 'signin' = 'signup') {
    router.push({ pathname: '/auth', params: { mode, role: 'buyer' } });
  }

  const carouselBlock = (
    <View
      style={[styles.carouselWrap, isWideLayout ? styles.carouselWrapWide : { height: CAROUSEL_HEIGHT }]}
      onLayout={(e) => setCarouselWidth(e.nativeEvent.layout.width)}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.carouselScroll}
        onScrollBeginDrag={() => setIsPaused(true)}
        onMomentumScrollEnd={handleMomentumEnd}>
        {WELCOME_SLIDES.map((slide) => (
          <View key={slide.dish} style={{ width: carouselWidth, height: '100%' }}>
            <Image contentFit="cover" source={{ uri: slide.image }} style={StyleSheet.absoluteFillObject} transition={300} />
          </View>
        ))}
      </ScrollView>

      <View style={styles.topRow}>
        <View style={styles.logoPill}>
          <AosellLogo compact />
        </View>
        <View style={styles.languagePill}>
          <SegmentedControl options={LANGUAGE_OPTIONS} value={locale} onChange={(next) => void setLocale(next)} />
        </View>
      </View>

      <View style={styles.captionRow}>
        <View style={[styles.captionCard, { borderRadius: theme.radii.md }]}>
          <Text style={[styles.captionDish, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
            {WELCOME_SLIDES[slideIndex].dish}
          </Text>
          <Text style={[styles.captionPlace, { color: theme.colors.textMuted, fontFamily: theme.typography.micro.fontFamily }]}>
            {WELCOME_SLIDES[slideIndex].place}
          </Text>
        </View>
        <View style={styles.dotsRow}>
          {WELCOME_SLIDES.map((slide, index) => (
            <View
              key={slide.dish}
              style={[
                styles.dot,
                index === slideIndex && styles.dotActive,
                { backgroundColor: index === slideIndex ? '#FFFFFF' : 'rgba(255,255,255,0.55)' },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );

  const sellerAccessLink = (
    <Pressable onPress={() => router.push('/seller-center')} style={styles.sellerAccessLink}>
      <Text style={[styles.mutedLink, { color: theme.colors.textMuted, fontFamily: theme.typography.label.fontFamily }]}>
        {t('welcome.sellerAccess')}
      </Text>
    </Pressable>
  );

  if (isWideLayout) {
    return (
      <SafeAreaView edges={['left', 'right']} style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.wideRow}>
          <View style={styles.wideCarouselCol}>{carouselBlock}</View>
          <ScrollView style={styles.wideFormCol} contentContainerStyle={styles.wideFormContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.display.fontFamily }]}>
              {t('welcome.title')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted, fontFamily: theme.typography.body.fontFamily }]}>
              {t('welcome.subtitle')}
            </Text>

            <View style={styles.phoneRow}>
              <View
                style={[
                  styles.countryButton,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.md },
                ]}>
                <GermanFlag />
                <Text style={[styles.countryCode, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>+49</Text>
              </View>
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
              </View>
            </View>

            <Pressable
              disabled={!isPhoneValid}
              onPress={() => goToAuth('signup')}
              style={[
                styles.continueButton,
                { backgroundColor: theme.colors.accent, borderRadius: theme.radii.md, opacity: isPhoneValid ? 1 : theme.motion.disabledOpacity },
              ]}>
              <Text style={[styles.continueText, { color: theme.colors.onAccent, fontFamily: theme.typography.heading.fontFamily }]}>
                {t('welcome.receiveCode')}
              </Text>
            </Pressable>

            <DividerLabel theme={theme} />

            <View style={styles.optionList}>
              <AuthOptionButton theme={theme} label={t('auth.apple')} type="apple" onPress={() => goToAuth('signup')} />
              <AuthOptionButton theme={theme} label={t('auth.google')} type="google" onPress={() => goToAuth('signup')} />
            </View>

            <View style={styles.linksRow}>
              <Pressable onPress={() => goToAuth('signup')}>
                <Text style={[styles.linkText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
                  {t('welcome.continueWithEmail')}
                </Text>
              </Pressable>
              <Pressable onPress={() => router.replace('/home')}>
                <Text style={[styles.mutedLink, { color: theme.colors.textMuted, fontFamily: theme.typography.label.fontFamily }]}>
                  {t('welcome.exploreGuest')}
                </Text>
              </Pressable>
            </View>

            {sellerAccessLink}

            <Text style={[styles.legalCopy, { color: theme.colors.textMuted }]}>{t('auth.legal')}</Text>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {carouselBlock}

        <View style={[styles.sheet, { backgroundColor: theme.colors.background, borderRadius: theme.radii.sheet }]}>
          <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.display.fontFamily }]}>
            {t('welcome.title')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted, fontFamily: theme.typography.body.fontFamily }]}>
            {t('welcome.subtitle')}
          </Text>

          <View style={styles.phoneRow}>
            <View
              style={[
                styles.countryButton,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.md },
              ]}>
              <GermanFlag />
              <Text style={[styles.countryCode, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>+49</Text>
            </View>
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
            </View>
          </View>

          <Pressable
            disabled={!isPhoneValid}
            onPress={() => goToAuth('signup')}
            style={[
              styles.continueButton,
              { backgroundColor: theme.colors.accent, borderRadius: theme.radii.md, opacity: isPhoneValid ? 1 : theme.motion.disabledOpacity },
            ]}>
            <Text style={[styles.continueText, { color: theme.colors.onAccent, fontFamily: theme.typography.heading.fontFamily }]}>
              {t('welcome.receiveCode')}
            </Text>
          </Pressable>

          <DividerLabel theme={theme} />

          <View style={styles.optionList}>
            <AuthOptionButton theme={theme} label={t('auth.apple')} type="apple" onPress={() => goToAuth('signup')} />
            <AuthOptionButton theme={theme} label={t('auth.google')} type="google" onPress={() => goToAuth('signup')} />
          </View>

          <View style={styles.linksRow}>
            <Pressable onPress={() => goToAuth('signup')}>
              <Text style={[styles.linkText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
                {t('welcome.continueWithEmail')}
              </Text>
            </Pressable>
            <Pressable onPress={() => router.replace('/home')}>
              <Text style={[styles.mutedLink, { color: theme.colors.textMuted, fontFamily: theme.typography.label.fontFamily }]}>
                {t('welcome.exploreGuest')}
              </Text>
            </Pressable>
          </View>

          {sellerAccessLink}

          <Text style={[styles.legalCopy, { color: theme.colors.textMuted }]}>{t('auth.legal')}</Text>
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

function AuthOptionButton({
  label,
  onPress,
  type,
  theme,
}: {
  label: string;
  onPress: () => void;
  type: 'apple' | 'google';
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
        <Text
          style={[
            styles.optionLetter,
            { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily },
            type === 'google' && styles.googleLetter,
          ]}>
          {type === 'google' ? 'G' : 'A'}
        </Text>
      </View>
      <Text style={[styles.optionLabel, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  carouselWrap: { position: 'relative', overflow: 'hidden' },
  carouselWrapWide: { flex: 1, height: '100%' },
  carouselScroll: { flex: 1 },
  wideRow: { flex: 1, flexDirection: 'row' },
  wideCarouselCol: { flex: 1 },
  wideFormCol: { width: 480 },
  wideFormContent: { paddingHorizontal: 40, paddingVertical: 48, gap: 16, justifyContent: 'center', flexGrow: 1 },
  sellerAccessLink: { alignSelf: 'center', marginTop: -4 },
  topRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoPill: {
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    justifyContent: 'center',
    shadowColor: '#14213D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  languagePill: { width: 168 },
  captionRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  captionCard: { backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 14, paddingVertical: 10, maxWidth: '68%' },
  captionDish: { fontSize: 15, lineHeight: 20 },
  captionPlace: { fontSize: 11, lineHeight: 14, marginTop: 2 },
  dotsRow: { flexDirection: 'row', gap: 5, paddingBottom: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { width: 18 },

  sheet: { marginTop: -24, paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24, gap: 16 },
  title: { fontSize: 28, lineHeight: 34 },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: -8 },

  phoneRow: { flexDirection: 'row', gap: 8 },
  countryButton: { minWidth: 84, minHeight: 52, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  countryCode: { fontSize: 15, lineHeight: 20 },
  flag: { width: 22, height: 15, borderRadius: 2, overflow: 'hidden' },
  flagStripe: { flex: 1, width: '100%' },
  flagBlack: { backgroundColor: '#111111' },
  flagRed: { backgroundColor: '#DD1E2F' },
  flagGold: { backgroundColor: '#F3C300' },
  phoneField: { flex: 1, minWidth: 0, minHeight: 52, borderWidth: 1, paddingHorizontal: 14, justifyContent: 'center' },
  phoneInput: { minWidth: 0, fontSize: 15 },

  continueButton: { minHeight: 56, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  continueText: { fontSize: 17, lineHeight: 22 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 14, lineHeight: 20 },

  optionList: { gap: 10 },
  optionButton: { minHeight: 52, borderWidth: 1, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  optionIcon: { width: 26, alignItems: 'center', justifyContent: 'center' },
  optionLetter: { fontSize: 16, lineHeight: 20 },
  googleLetter: { color: '#4285F4' },
  optionLabel: { fontSize: 15, lineHeight: 20 },

  linksRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginTop: 4 },
  linkText: { fontSize: 13, lineHeight: 18, textDecorationLine: 'underline' },
  mutedLink: { fontSize: 13, lineHeight: 18 },
  legalCopy: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  pressed: { opacity: 0.78 },
});
