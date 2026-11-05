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

  function goToAuth(mode: 'signup' | 'signin' = 'signup') {
    router.push({ pathname: '/auth', params: { mode, role: 'buyer' } });
  }

  const carouselBlock = (
    <View style={[styles.carouselWrap, isWideLayout ? styles.carouselWrapWide : { height: CAROUSEL_HEIGHT }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.carouselScroll}
        onLayout={(e) => setCarouselWidth(e.nativeEvent.layout.width)}
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

            <Pressable
              onPress={() => goToAuth('signup')}
              style={[styles.continueButton, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.md }]}>
              <Text style={[styles.continueText, { color: theme.colors.onAccent, fontFamily: theme.typography.heading.fontFamily }]}>
                {t('welcome.getStarted')}
              </Text>
            </Pressable>

            <Pressable style={styles.guestLink} onPress={() => router.replace('/home')}>
              <Text style={[styles.mutedLink, { color: theme.colors.textMuted, fontFamily: theme.typography.label.fontFamily }]}>
                {t('welcome.exploreGuest')}
              </Text>
            </Pressable>

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

          <Pressable
            onPress={() => goToAuth('signup')}
            style={[styles.continueButton, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.md }]}>
            <Text style={[styles.continueText, { color: theme.colors.onAccent, fontFamily: theme.typography.heading.fontFamily }]}>
              {t('welcome.getStarted')}
            </Text>
          </Pressable>

          <Pressable style={styles.guestLink} onPress={() => router.replace('/home')}>
            <Text style={[styles.mutedLink, { color: theme.colors.textMuted, fontFamily: theme.typography.label.fontFamily }]}>
              {t('welcome.exploreGuest')}
            </Text>
          </Pressable>

          {sellerAccessLink}

          <Text style={[styles.legalCopy, { color: theme.colors.textMuted }]}>{t('auth.legal')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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

  continueButton: { minHeight: 56, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  continueText: { fontSize: 17, lineHeight: 22 },

  guestLink: { alignSelf: 'center', marginTop: 4 },
  mutedLink: { fontSize: 13, lineHeight: 18 },
  legalCopy: { fontSize: 11, lineHeight: 16, marginTop: 4 },
});
