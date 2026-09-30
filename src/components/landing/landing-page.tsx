import { Image } from 'expo-image';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { AosellLogo } from '@/components/brand/aosell-logo';
import { APP_STORE_URL, GOOGLE_PLAY_URL, areStoresLive } from '@/constants/app-links';
import { DEFAULT_CITY } from '@/constants/location';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { trackEvent } from '@/lib/analytics/track-event';
import { getPrimaryListingImage } from '@/lib/utils/listing-media';
import { formatMoney } from '@/lib/utils/format';
import { useAosell } from '@/providers/aosell-provider';
import type { Listing } from '@/types/domain';

type AppTheme = ReturnType<typeof useAppTheme>;

const MARQUEE_DURATION_MS = 36000;
const CARD_FLOAT_DURATION_MS = 5400;

function clamp(min: number, value: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function prefersReducedMotion() {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function LandingPage() {
  const theme = useAppTheme();
  const { t, locale } = useLocale();
  const { listings, getSellerById } = useAosell();
  const { width } = useWindowDimensions();

  const isTablet = width >= 700;
  const isDesktop = width >= 1100;
  const contentInset = clamp(18, width * 0.04, 36);
  const sectionGap = clamp(64, width * 0.08, 112);

  const [address, setAddress] = useState('');

  const dishListings = listings.filter((listing) => listing.type === 'meal' && getPrimaryListingImage(listing)?.url);
  const featuredDishes = dishListings.slice(0, 4);

  function goToSearch() {
    trackEvent('cta_web_hero');
    router.push(address.trim() ? { pathname: '/search', params: { address: address.trim() } } : '/search');
  }

  function scrollToChoose() {
    // Anchor scrolling on web-exported static pages works via the browser's
    // native #hash handling once the element carries a matching id — see
    // the nativeID on the "choose" section below.
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.getElementById('choisir')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const siteUrl = 'https://aosell-3f431.web.app';
  const ogTitle = t('landing.hero.title');
  const ogDescription = t('landing.hero.subtitle');

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: isTablet ? 0 : 84 }} showsVerticalScrollIndicator={false}>
      <Head>
        <title>AoSell — {ogTitle}</title>
        <meta name="description" content={ogDescription} />
        <meta property="og:title" content={`AoSell — ${ogTitle}`} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <html lang={locale} />
        <link rel="alternate" hrefLang="fr" href={siteUrl} />
        <link rel="alternate" hrefLang="de" href={siteUrl} />
        <link rel="alternate" hrefLang="en" href={siteUrl} />
      </Head>

      <HeroSection
        theme={theme}
        t={t}
        isDesktop={isDesktop}
        contentInset={contentInset}
        address={address}
        onChangeAddress={setAddress}
        onSubmitAddress={goToSearch}
      />

      <MarqueeBanner theme={theme} dishTitles={dishListings.map((listing) => listing.title)} />

      <HowItWorksSection theme={theme} t={t} contentInset={contentInset} sectionGap={sectionGap} />

      {featuredDishes.length ? (
        <DishesSection
          theme={theme}
          t={t}
          contentInset={contentInset}
          sectionGap={sectionGap}
          dishes={featuredDishes}
          getSellerName={(sellerId) => getSellerById(sellerId)?.brandName}
        />
      ) : null}

      <ChooseSection theme={theme} t={t} contentInset={contentInset} sectionGap={sectionGap} isDesktop={isDesktop} />

      <PartnersBanner theme={theme} t={t} contentInset={contentInset} sectionGap={sectionGap} />

      <FaqSection theme={theme} t={t} contentInset={contentInset} sectionGap={sectionGap} />

      <FinalCtaSection theme={theme} t={t} contentInset={contentInset} sectionGap={sectionGap} onScrollToChoose={scrollToChoose} />

      <Footer theme={theme} t={t} contentInset={contentInset} />

      {!isTablet ? <StickyMobileBar theme={theme} t={t} onOrder={goToSearch} onScrollToChoose={scrollToChoose} /> : null}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function HeroSection({
  theme,
  t,
  isDesktop,
  contentInset,
  address,
  onChangeAddress,
  onSubmitAddress,
}: {
  theme: AppTheme;
  t: (key: string) => string;
  isDesktop: boolean;
  contentInset: number;
  address: string;
  onChangeAddress: (value: string) => void;
  onSubmitAddress: () => void;
}) {
  return (
    <View style={[styles.hero, { backgroundColor: theme.colors.accent, paddingHorizontal: contentInset }]}>
      <View style={styles.heroNav}>
        <AosellLogo compact />
        {isDesktop ? (
          <View style={styles.heroNavLinks}>
            <HeroNavLink label={t('landing.nav.howItWorks')} target="comment" />
            <HeroNavLink label={t('landing.nav.dishes')} target="plats" />
            <HeroNavLink label={t('landing.nav.app')} target="choisir" />
            <HeroNavLink label={t('landing.nav.faq')} target="faq" />
          </View>
        ) : null}
        <Pressable onPress={() => router.push('/auth')} style={[styles.heroSignIn, { borderColor: theme.colors.text }]}>
          <Text style={[styles.heroSignInText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
            {t('landing.nav.signIn')}
          </Text>
        </Pressable>
      </View>

      <View style={[styles.heroBody, isDesktop && styles.heroBodyDesktop]}>
        <View style={[styles.heroCopy, isDesktop && styles.heroCopyDesktop]}>
          <View style={[styles.heroBadge, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.heroBadgeDot, { backgroundColor: theme.colors.success }]} />
            <Text style={[styles.heroBadgeText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
              {t('landing.hero.badge')}
            </Text>
          </View>

          <Text style={[styles.heroTitle, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.headingHeavy }]}>
            {t('landing.hero.title')}
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.colors.text }]}>{t('landing.hero.subtitle')}</Text>

          <View style={[styles.heroForm, { backgroundColor: theme.colors.background, borderRadius: 20 }, theme.shadows.lg]}>
            <Text style={[styles.heroFormLabel, { color: theme.colors.textMuted, fontFamily: theme.typography.label.fontFamily }]}>
              {t('landing.hero.addressLabel')}
            </Text>
            <View style={styles.heroFormRow}>
              <TextInput
                onChangeText={onChangeAddress}
                onSubmitEditing={onSubmitAddress}
                placeholder={t('landing.hero.addressPlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.heroFormInput, { color: theme.colors.text, fontFamily: theme.typography.body.fontFamily }]}
                value={address}
              />
              <Pressable
                onPress={onSubmitAddress}
                style={[styles.heroFormCta, { backgroundColor: theme.colors.text, borderRadius: 14 }]}>
                <Text style={[styles.heroFormCtaText, { color: theme.colors.background, fontFamily: theme.typography.heading.fontFamily }]}>
                  {t('landing.hero.addressCta')}
                </Text>
              </Pressable>
            </View>
          </View>

          <Text style={[styles.heroDownloadPrompt, { color: theme.colors.text }]}>{t('landing.hero.downloadPrompt')}</Text>
          <StoreBadges theme={theme} tone="ink" />
        </View>

        {isDesktop ? <HeroMockup theme={theme} t={t} /> : null}
      </View>
    </View>
  );
}

function HeroNavLink({ label, target }: { label: string; target: string }) {
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
        }
      }}>
      <Text style={styles.heroNavLinkText}>{label}</Text>
    </Pressable>
  );
}

function HeroMockup({ theme, t }: { theme: AppTheme; t: (key: string) => string }) {
  const courierFloat = useFloatAnimation(0);
  const promoFloat = useFloatAnimation(1200);
  const likesFloat = useFloatAnimation(2400);

  return (
    <View style={styles.heroMockup}>
      <View style={[styles.heroMockupCircle, { backgroundColor: '#FFC633' }]} />
      <View style={[styles.heroPhone, { backgroundColor: theme.colors.text, borderRadius: 40 }, theme.shadows.lg]}>
        <View style={[styles.heroPhoneScreen, { backgroundColor: theme.colors.background, borderRadius: 30 }]} />
      </View>

      <Animated.View style={[styles.heroFloatCard, { top: 24, left: -16, transform: [{ translateY: courierFloat }] }, theme.shadows.md]}>
        <SymbolView tintColor={theme.colors.success} size={16} name={{ ios: 'bicycle', android: 'directions_bike', web: 'directions_bike' }} />
        <Text style={[styles.heroFloatCardText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
          {t('landing.hero.cardCourier')}
        </Text>
      </Animated.View>

      <Animated.View style={[styles.heroFloatCard, { top: '42%', right: -20, transform: [{ translateY: promoFloat }] }, theme.shadows.md]}>
        <View style={[styles.heroFloatBadge, { backgroundColor: theme.colors.secondary }]}>
          <Text style={[styles.heroFloatBadgeText, { color: theme.colors.text }]}>{t('landing.hero.cardPromo')}</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.heroFloatCard, { bottom: 32, left: -8, transform: [{ translateY: likesFloat }] }, theme.shadows.md]}>
        <SymbolView tintColor={theme.colors.secondaryStrong} size={16} name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }} />
        <Text style={[styles.heroFloatCardText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
          {t('landing.hero.cardLikes')}
        </Text>
      </Animated.View>
    </View>
  );
}

function useFloatAnimation(delayMs: number) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: -8, duration: CARD_FLOAT_DURATION_MS / 2, delay: delayMs, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: CARD_FLOAT_DURATION_MS / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [value, delayMs]);

  return value;
}

// ---------------------------------------------------------------------------
// Marquee
// ---------------------------------------------------------------------------

function MarqueeBanner({ theme, dishTitles }: { theme: AppTheme; dishTitles: string[] }) {
  const items = dishTitles.length ? dishTitles : ['AoSell'];
  const translateX = useRef(new Animated.Value(0)).current;
  const [rowWidth, setRowWidth] = useState(0);

  useEffect(() => {
    if (!rowWidth || prefersReducedMotion()) {
      return;
    }
    translateX.setValue(0);
    const loop = Animated.loop(
      Animated.timing(translateX, { toValue: -rowWidth, duration: MARQUEE_DURATION_MS, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [rowWidth, translateX]);

  return (
    <View style={[styles.marquee, { backgroundColor: theme.colors.text }]}>
      <Animated.View style={[styles.marqueeTrack, { transform: [{ translateX }] }]}>
        <View style={styles.marqueeRow} onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}>
          <MarqueeItems items={items} theme={theme} />
        </View>
        <View style={styles.marqueeRow}>
          <MarqueeItems items={items} theme={theme} />
        </View>
      </Animated.View>
    </View>
  );
}

function MarqueeItems({ items, theme }: { items: string[]; theme: AppTheme }) {
  return (
    <>
      {items.map((dish, index) => (
        <View key={`${dish}-${index}`} style={styles.marqueeItem}>
          <Text style={[styles.marqueeText, { color: theme.colors.accent, fontFamily: theme.typography.fontFamily.headingHeavy }]}>{dish}</Text>
          <View style={[styles.marqueeDot, { backgroundColor: theme.colors.secondary }]} />
        </View>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// How it works
// ---------------------------------------------------------------------------

function HowItWorksSection({
  theme,
  t,
  contentInset,
  sectionGap,
}: {
  theme: AppTheme;
  t: (key: string) => string;
  contentInset: number;
  sectionGap: number;
}) {
  const steps = [
    { number: 1, color: theme.colors.accent, title: t('landing.howItWorks.step1Title'), body: t('landing.howItWorks.step1Body') },
    { number: 2, color: theme.colors.text, title: t('landing.howItWorks.step2Title'), body: t('landing.howItWorks.step2Body') },
    { number: 3, color: theme.colors.secondary, title: t('landing.howItWorks.step3Title'), body: t('landing.howItWorks.step3Body') },
  ];

  return (
    <View nativeID="comment" style={[styles.section, { paddingHorizontal: contentInset, paddingTop: sectionGap }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.headingHeavy }]}>
        {t('landing.howItWorks.title')}
      </Text>
      <View style={styles.stepsRow}>
        {steps.map((step) => (
          <View key={step.number} style={[styles.stepCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
            <View style={[styles.stepNumber, { backgroundColor: step.color }]}>
              <Text style={[styles.stepNumberText, { color: theme.colors.background, fontFamily: theme.typography.fontFamily.headingHeavy }]}>
                {step.number}
              </Text>
            </View>
            <Text style={[styles.stepTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>{step.title}</Text>
            <Text style={[styles.stepBody, { color: theme.colors.textMuted }]}>{step.body}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Dishes
// ---------------------------------------------------------------------------

function DishesSection({
  theme,
  t,
  contentInset,
  sectionGap,
  dishes,
  getSellerName,
}: {
  theme: AppTheme;
  t: (key: string) => string;
  contentInset: number;
  sectionGap: number;
  dishes: Listing[];
  getSellerName: (sellerId: string) => string | undefined;
}) {
  return (
    <View nativeID="plats" style={[styles.section, { paddingHorizontal: contentInset, paddingTop: sectionGap }]}>
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.headingHeavy }]}>
          {t('landing.dishes.title')}
        </Text>
        <Pressable onPress={() => router.push('/search')}>
          <Text style={[styles.linkText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
            {t('landing.dishes.viewAll')}
          </Text>
        </Pressable>
      </View>
      <View style={styles.dishGrid}>
        {dishes.map((listing) => {
          const image = getPrimaryListingImage(listing);
          return (
            <Pressable
              key={listing.id}
              onPress={() => {
                trackEvent('cta_web_card');
                router.push(`/listing/${listing.id}`);
              }}
              style={[styles.dishCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
              <View style={[styles.dishCardImage, { backgroundColor: theme.colors.accentTint }]}>
                {image?.url ? <Image contentFit="cover" source={{ uri: image.url }} style={StyleSheet.absoluteFillObject} transition={200} /> : null}
              </View>
              <View style={styles.dishCardBody}>
                <Text style={[styles.dishCardName, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]} numberOfLines={1}>
                  {listing.title}
                </Text>
                <Text style={[styles.dishCardMeta, { color: theme.colors.textMuted }]} numberOfLines={1}>
                  {getSellerName(listing.sellerId)}
                </Text>
                <Text style={[styles.dishCardPrice, { color: theme.colors.secondaryText, fontFamily: theme.typography.label.fontFamily }]}>
                  {formatMoney(listing.price)}
                </Text>
                <View style={[styles.dishCardCta, { borderColor: theme.colors.text }]}>
                  <Text style={[styles.dishCardCtaText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
                    {t('landing.dishes.orderCta')}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Choose: app or web
// ---------------------------------------------------------------------------

function ChooseSection({
  theme,
  t,
  contentInset,
  sectionGap,
  isDesktop,
}: {
  theme: AppTheme;
  t: (key: string) => string;
  contentInset: number;
  sectionGap: number;
  isDesktop: boolean;
}) {
  return (
    <View nativeID="choisir" style={[styles.section, { paddingHorizontal: contentInset, paddingTop: sectionGap }]}>
      <View style={styles.chooseGrid}>
        <View style={[styles.chooseCard, { backgroundColor: theme.colors.text, borderRadius: theme.radii.xl }]}>
          <View style={[styles.choosePill, { backgroundColor: theme.colors.accent }]}>
            <Text style={[styles.choosePillText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
              {t('landing.choose.appBadge')}
            </Text>
          </View>
          <Text style={[styles.chooseTitle, { color: theme.colors.background, fontFamily: theme.typography.heading.fontFamily }]}>
            {t('landing.choose.appTitle')}
          </Text>
          <ChooseBenefit label={t('landing.choose.appBenefit1')} color={theme.colors.background} />
          <ChooseBenefit label={t('landing.choose.appBenefit2')} color={theme.colors.background} />
          <ChooseBenefit label={t('landing.choose.appBenefit3')} color={theme.colors.background} />
          <StoreBadges theme={theme} tone="light" />
          {isDesktop && areStoresLive ? (
            <View style={[styles.qrWrap, { backgroundColor: theme.colors.background, borderRadius: theme.radii.lg }]}>
              <QRCode value={APP_STORE_URL || GOOGLE_PLAY_URL} size={118} backgroundColor={theme.colors.background} color={theme.colors.text} />
              <Text style={[styles.qrLabel, { color: theme.colors.text }]}>{t('landing.choose.qrLabel')}</Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.chooseCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radii.xl }]}>
          <View style={[styles.choosePill, { backgroundColor: theme.colors.surfaceMuted }]}>
            <Text style={[styles.choosePillText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
              {t('landing.choose.webBadge')}
            </Text>
          </View>
          <Text style={[styles.chooseTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
            {t('landing.choose.webTitle')}
          </Text>
          <ChooseBenefit label={t('landing.choose.webBenefit1')} color={theme.colors.text} />
          <ChooseBenefit label={t('landing.choose.webBenefit2')} color={theme.colors.text} />
          <ChooseBenefit label={t('landing.choose.webBenefit3')} color={theme.colors.text} />
          <Pressable
            onPress={() => {
              trackEvent('cta_web_card');
              router.push('/search');
            }}
            style={[styles.chooseCta, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.md }, theme.shadows.accent]}>
            <Text style={[styles.chooseCtaText, { color: theme.colors.onAccent, fontFamily: theme.typography.heading.fontFamily }]}>
              {t('landing.choose.webCta')}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ChooseBenefit({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.chooseBenefitRow}>
      <View style={[styles.chooseBenefitDot, { backgroundColor: color }]} />
      <Text style={[styles.chooseBenefitText, { color }]}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Store badges (shared)
// ---------------------------------------------------------------------------

function StoreBadges({ theme, tone }: { theme: AppTheme; tone: 'ink' | 'light' }) {
  const { t } = useLocale();
  const textColor = tone === 'ink' ? theme.colors.text : theme.colors.background;
  const borderColor = tone === 'ink' ? theme.colors.text : theme.colors.background;

  function handlePress(store: 'store_ios' | 'store_android', url: string) {
    trackEvent(store);
    if (areStoresLive && Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  }

  return (
    <View style={styles.storeBadgesRow}>
      <Pressable onPress={() => handlePress('store_ios', APP_STORE_URL)} style={[styles.storeBadge, { borderColor }]}>
        <SymbolView tintColor={textColor} size={18} name={{ ios: 'apple.logo', android: 'phone_iphone', web: 'phone_iphone' }} />
        <Text style={[styles.storeBadgeText, { color: textColor }]}>{areStoresLive ? 'App Store' : t('landing.storesComingSoon')}</Text>
      </Pressable>
      <Pressable onPress={() => handlePress('store_android', GOOGLE_PLAY_URL)} style={[styles.storeBadge, { borderColor }]}>
        <SymbolView tintColor={textColor} size={18} name={{ ios: 'play.rectangle', android: 'shop', web: 'shop' }} />
        <Text style={[styles.storeBadgeText, { color: textColor }]}>{areStoresLive ? 'Google Play' : t('landing.storesComingSoon')}</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Partners banner
// ---------------------------------------------------------------------------

function PartnersBanner({
  theme,
  t,
  contentInset,
  sectionGap,
}: {
  theme: AppTheme;
  t: (key: string) => string;
  contentInset: number;
  sectionGap: number;
}) {
  return (
    <View style={[styles.section, { paddingHorizontal: contentInset, paddingTop: sectionGap }]}>
      <View style={[styles.partnersBanner, { backgroundColor: theme.colors.accentTint, borderRadius: theme.radii.xl }]}>
        <Text style={[styles.partnersTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
          {t('landing.partners.title')}
        </Text>
        <Pressable onPress={() => router.push('/partner' as never)} style={[styles.partnersCta, { borderColor: theme.colors.text }]}>
          <Text style={[styles.partnersCtaText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
            {t('landing.partners.cta')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

function FaqSection({
  theme,
  t,
  contentInset,
  sectionGap,
}: {
  theme: AppTheme;
  t: (key: string) => string;
  contentInset: number;
  sectionGap: number;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const questions = [
    { q: t('landing.faq.q1'), a: t('landing.faq.a1') },
    { q: t('landing.faq.q2'), a: t('landing.faq.a2') },
    { q: t('landing.faq.q3'), a: t('landing.faq.a3') },
    { q: t('landing.faq.q4'), a: t('landing.faq.a4') },
  ];

  return (
    <View nativeID="faq" style={[styles.section, { paddingHorizontal: contentInset, paddingTop: sectionGap }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.headingHeavy }]}>
        {t('landing.faq.title')}
      </Text>
      <View style={styles.faqList}>
        {questions.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <Pressable
              key={item.q}
              onPress={() => setOpenIndex(isOpen ? null : index)}
              style={[styles.faqItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
              <View style={styles.faqHeaderRow}>
                <Text style={[styles.faqQuestion, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>{item.q}</Text>
                <View
                  style={[
                    styles.faqIcon,
                    { backgroundColor: isOpen ? theme.colors.accent : theme.colors.surfaceMuted, transform: [{ rotate: isOpen ? '45deg' : '0deg' }] },
                  ]}>
                  <Text style={[styles.faqIconText, { color: theme.colors.text }]}>+</Text>
                </View>
              </View>
              {isOpen ? <Text style={[styles.faqAnswer, { color: theme.colors.textMuted }]}>{item.a}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Final CTA
// ---------------------------------------------------------------------------

function FinalCtaSection({
  theme,
  t,
  contentInset,
  sectionGap,
  onScrollToChoose,
}: {
  theme: AppTheme;
  t: (key: string) => string;
  contentInset: number;
  sectionGap: number;
  onScrollToChoose: () => void;
}) {
  return (
    <View style={[styles.section, { paddingHorizontal: contentInset, paddingTop: sectionGap }]}>
      <View style={[styles.finalCard, { backgroundColor: theme.colors.accent, borderRadius: 32 }]}>
        <View style={[styles.finalCircle, styles.finalCircleTop, { backgroundColor: '#FFC633' }]} />
        <View style={[styles.finalCircle, styles.finalCircleBottom, { backgroundColor: '#FFC633' }]} />
        <Text style={[styles.finalTitle, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.headingHeavy }]}>
          {t('landing.finalCta.title')}
        </Text>
        <View style={styles.finalActions}>
          <Pressable
            onPress={() => {
              trackEvent('cta_web_final');
              router.push('/search');
            }}
            style={[styles.finalCtaButton, { backgroundColor: theme.colors.text, borderRadius: theme.radii.md }]}>
            <Text style={[styles.finalCtaButtonText, { color: theme.colors.background, fontFamily: theme.typography.heading.fontFamily }]}>
              {t('landing.finalCta.ctaWeb')}
            </Text>
          </Pressable>
          <Pressable onPress={onScrollToChoose} style={[styles.finalCtaButton, { backgroundColor: theme.colors.background, borderRadius: theme.radii.md }]}>
            <Text style={[styles.finalCtaButtonText, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
              {t('landing.finalCta.ctaApp')}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function Footer({ theme, t, contentInset }: { theme: AppTheme; t: (key: string) => string; contentInset: number }) {
  return (
    <View style={[styles.footer, { paddingHorizontal: contentInset, borderTopColor: theme.colors.border }]}>
      <AosellLogo compact />
      <View style={styles.footerLinks}>
        <Text style={[styles.footerLink, { color: theme.colors.textMuted }]}>{t('landing.footer.legal')}</Text>
        <Text style={[styles.footerLink, { color: theme.colors.textMuted }]}>{t('landing.footer.privacy')}</Text>
        <Text style={[styles.footerLink, { color: theme.colors.textMuted }]}>{t('landing.footer.terms')}</Text>
        <Pressable onPress={() => router.push('/support' as never)}>
          <Text style={[styles.footerLink, { color: theme.colors.textMuted }]}>{t('landing.footer.contact')}</Text>
        </Pressable>
      </View>
      <Text style={[styles.footerCopyright, { color: theme.colors.textMuted }]}>{t('landing.footer.copyright')}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sticky mobile bar
// ---------------------------------------------------------------------------

function StickyMobileBar({
  theme,
  t,
  onOrder,
  onScrollToChoose,
}: {
  theme: AppTheme;
  t: (key: string) => string;
  onOrder: () => void;
  onScrollToChoose: () => void;
}) {
  return (
    <View style={[styles.stickyBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
      <Pressable
        onPress={() => {
          trackEvent('sticky_order');
          onOrder();
        }}
        style={[styles.stickyButton, { backgroundColor: theme.colors.accent }]}>
        <Text style={[styles.stickyButtonText, { color: theme.colors.onAccent, fontFamily: theme.typography.heading.fontFamily }]}>
          {t('landing.stickyBar.order')}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => {
          trackEvent('sticky_app');
          onScrollToChoose();
        }}
        style={[styles.stickyButton, { backgroundColor: theme.colors.text }]}>
        <Text style={[styles.stickyButtonText, { color: theme.colors.background, fontFamily: theme.typography.heading.fontFamily }]}>
          {t('landing.stickyBar.app')}
        </Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1 },

  hero: { paddingTop: 24, paddingBottom: 56 },
  heroNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 40 },
  heroNavLinks: { flexDirection: 'row', gap: 24, flex: 1, justifyContent: 'center' },
  heroNavLinkText: { fontSize: 14, lineHeight: 19, color: '#14213D', fontWeight: '600' },
  heroSignIn: { height: 40, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  heroSignInText: { fontSize: 14, lineHeight: 19 },

  heroBody: { gap: 32 },
  heroBodyDesktop: { flexDirection: 'row', alignItems: 'center', gap: 48 },
  heroCopy: { gap: 16, maxWidth: 620 },
  heroCopyDesktop: { flex: 1 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  heroBadgeDot: { width: 8, height: 8, borderRadius: 4 },
  heroBadgeText: { fontSize: 13, lineHeight: 18 },
  heroTitle: { fontSize: 44, lineHeight: 50 },
  heroSubtitle: { fontSize: 17, lineHeight: 25, maxWidth: 520 },

  heroForm: { padding: 16, gap: 10, marginTop: 8 },
  heroFormLabel: { fontSize: 12, lineHeight: 16, textTransform: 'uppercase', letterSpacing: 0.4 },
  heroFormRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  heroFormInput: { flex: 1, minWidth: 160, height: 52, fontSize: 15 },
  heroFormCta: { height: 52, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  heroFormCtaText: { fontSize: 15, lineHeight: 20 },

  heroDownloadPrompt: { fontSize: 14, lineHeight: 19, marginTop: 4 },
  storeBadgesRow: { flexDirection: 'row', gap: 10, marginTop: 4, flexWrap: 'wrap' },
  storeBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5 },
  storeBadgeText: { fontSize: 13, lineHeight: 18, fontWeight: '600' },

  heroMockup: { flex: 1, minHeight: 420, alignItems: 'center', justifyContent: 'center' },
  heroMockupCircle: { position: 'absolute', width: 340, height: 340, borderRadius: 170, opacity: 0.6 },
  heroPhone: { width: 220, height: 400, padding: 10, transform: [{ rotate: '-4deg' }] },
  heroPhoneScreen: { flex: 1 },
  heroFloatCard: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  heroFloatCardText: { fontSize: 13, lineHeight: 18 },
  heroFloatBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  heroFloatBadgeText: { fontSize: 12, lineHeight: 16, fontWeight: '700' },

  marquee: { paddingVertical: 20, overflow: 'hidden' },
  marqueeTrack: { flexDirection: 'row' },
  marqueeRow: { flexDirection: 'row', alignItems: 'center' },
  marqueeItem: { flexDirection: 'row', alignItems: 'center', gap: 24, marginRight: 24 },
  marqueeText: { fontSize: 28, lineHeight: 34 },
  marqueeDot: { width: 8, height: 8, borderRadius: 4 },

  section: { maxWidth: 1240, width: '100%', alignSelf: 'center' },
  sectionTitle: { fontSize: 32, lineHeight: 38, textAlign: 'center' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  linkText: { fontSize: 14, lineHeight: 19, textDecorationLine: 'underline' },

  stepsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginTop: 32, justifyContent: 'center' },
  stepCard: { flexGrow: 1, minWidth: 240, maxWidth: 360, borderWidth: 1, padding: 24, gap: 12 },
  stepNumber: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontSize: 22, lineHeight: 26 },
  stepTitle: { fontSize: 18, lineHeight: 24 },
  stepBody: { fontSize: 14, lineHeight: 21 },

  dishGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginTop: 24 },
  dishCard: { flexGrow: 1, minWidth: 240, maxWidth: 300, borderWidth: 1, overflow: 'hidden' },
  dishCardImage: { aspectRatio: 4 / 3 },
  dishCardBody: { padding: 16, gap: 4 },
  dishCardName: { fontSize: 16, lineHeight: 21 },
  dishCardMeta: { fontSize: 13, lineHeight: 18 },
  dishCardPrice: { fontSize: 17, lineHeight: 22, marginTop: 2 },
  dishCardCta: { marginTop: 10, height: 40, borderWidth: 1.5, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dishCardCtaText: { fontSize: 13, lineHeight: 18 },

  chooseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, justifyContent: 'center' },
  chooseCard: { flexGrow: 1, minWidth: 300, maxWidth: 520, padding: 32, gap: 14 },
  choosePill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  choosePillText: { fontSize: 12, lineHeight: 16 },
  chooseTitle: { fontSize: 24, lineHeight: 30, marginTop: 4 },
  chooseBenefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chooseBenefitDot: { width: 6, height: 6, borderRadius: 3 },
  chooseBenefitText: { fontSize: 14, lineHeight: 20 },
  chooseCta: { height: 52, marginTop: 12, alignItems: 'center', justifyContent: 'center' },
  chooseCtaText: { fontSize: 15, lineHeight: 20 },
  qrWrap: { alignSelf: 'flex-start', marginTop: 16, padding: 14, alignItems: 'center', gap: 8 },
  qrLabel: { fontSize: 11, lineHeight: 15 },

  partnersBanner: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: 28 },
  partnersTitle: { fontSize: 20, lineHeight: 26, flex: 1, minWidth: 220 },
  partnersCta: { height: 48, paddingHorizontal: 20, borderWidth: 1.5, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  partnersCtaText: { fontSize: 14, lineHeight: 19 },

  faqList: { gap: 12, marginTop: 32, maxWidth: 760, width: '100%', alignSelf: 'center' },
  faqItem: { borderWidth: 1, padding: 20 },
  faqHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  faqQuestion: { fontSize: 16, lineHeight: 22, flex: 1 },
  faqIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  faqIconText: { fontSize: 16, lineHeight: 20 },
  faqAnswer: { fontSize: 14, lineHeight: 21, marginTop: 12 },

  finalCard: { alignItems: 'center', padding: 48, gap: 24, overflow: 'hidden' },
  finalCircle: { position: 'absolute', width: 220, height: 220, borderRadius: 110, opacity: 0.5 },
  finalCircleTop: { top: -80, right: -60 },
  finalCircleBottom: { bottom: -80, left: -60 },
  finalTitle: { fontSize: 30, lineHeight: 36, textAlign: 'center', maxWidth: 480 },
  finalActions: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  finalCtaButton: { height: 52, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  finalCtaButtonText: { fontSize: 15, lineHeight: 20 },

  footer: { marginTop: 64, paddingTop: 32, paddingBottom: 40, borderTopWidth: 1, alignItems: 'center', gap: 16 },
  footerLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, justifyContent: 'center' },
  footerLink: { fontSize: 13, lineHeight: 18 },
  footerCopyright: { fontSize: 12, lineHeight: 16 },

  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 10,
  },
  stickyButton: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stickyButtonText: { fontSize: 14, lineHeight: 19 },
});
