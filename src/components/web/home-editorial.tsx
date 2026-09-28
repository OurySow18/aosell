import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { DEFAULT_CITY } from '@/constants/location';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { getCuisineLabel, getDeliveryModeLabel } from '@/lib/i18n';
import { formatMoney } from '@/lib/utils/format';
import { getPrimaryListingImage } from '@/lib/utils/listing-media';
import { useAosell } from '@/providers/aosell-provider';
import type { Listing, SellerProfile } from '@/types/domain';

type AppTheme = ReturnType<typeof useAppTheme>;

const BANNER_ROTATION_MS = 4000;

export function HomeEditorial() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const { addresses, sellers, listings, getSellerById } = useAosell();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const bannerHeight = Math.min(580, Math.max(460, width * 0.58));
  const contentInset = Math.min(32, Math.max(16, width * 0.04));

  const slides = listings.filter((listing) => listing.type === 'meal' && getPrimaryListingImage(listing)?.url).slice(0, 5);

  useEffect(() => {
    if (isPaused || slides.length < 2) {
      return;
    }
    const timer = setInterval(() => {
      setSlideIndex((current) => {
        const next = (current + 1) % slides.length;
        scrollRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, BANNER_ROTATION_MS);
    return () => clearInterval(timer);
  }, [isPaused, width, slides.length]);

  function handleMomentumEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setSlideIndex(Math.round(event.nativeEvent.contentOffset.x / width));
    setIsPaused(false);
  }

  const defaultAddress = addresses.find((item) => item.isDefault) ?? addresses[0];
  const addressLabel = defaultAddress ? `${defaultAddress.line1}, ${defaultAddress.city}` : DEFAULT_CITY;

  const availableCuisines = Array.from(new Set(sellers.flatMap((seller) => seller.cuisineSpecialties)));
  const mealListings = listings.filter((listing) => listing.type === 'meal');
  const nearbySellers = sellers.slice(0, 6);

  const activeSlide = slides[slideIndex];
  const activeSeller = activeSlide ? getSellerById(activeSlide.sellerId) : undefined;

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: theme.spacing[12] }} showsVerticalScrollIndicator={false}>
      {/* Banner */}
      <View style={[styles.banner, { height: bannerHeight, backgroundColor: theme.colors.accentTint }]}>
        {slides.length ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScrollBeginDrag={() => setIsPaused(true)}
            onMomentumScrollEnd={handleMomentumEnd}>
            {slides.map((listing) => {
              const image = getPrimaryListingImage(listing);
              return (
                <Image
                  key={listing.id}
                  contentFit="cover"
                  source={image?.url ? { uri: image.url } : undefined}
                  style={{ width, height: bannerHeight }}
                  transition={300}
                />
              );
            })}
          </ScrollView>
        ) : null}
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.colors.overlay }]} pointerEvents="none" />

        <View
          style={[
            styles.heroCard,
            { left: contentInset, backgroundColor: theme.colors.surface, borderRadius: theme.radii.sheet, maxWidth: Math.min(560, width - contentInset * 2) },
          ]}>
          <Text style={[styles.heroEyebrow, { color: theme.colors.textMuted, fontFamily: theme.typography.micro.fontFamily }]}>
            {t('homeEditorial.eyebrow')}
          </Text>
          <Text style={[styles.heroTitle, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.headingHeavy }]}>
            {t('homeEditorial.title')}
          </Text>
          <View style={styles.heroAddressRow}>
            <SymbolView tintColor={theme.colors.textMuted} size={16} name={{ ios: 'mappin', android: 'location_on', web: 'location_on' }} />
            <Text style={[styles.heroAddress, { color: theme.colors.textMuted }]} numberOfLines={1}>
              {addressLabel}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/search')}
            style={[styles.heroCta, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.md }, theme.shadows.accent]}>
            <Text style={[styles.heroCtaText, { color: theme.colors.onAccent, fontFamily: theme.typography.heading.fontFamily }]}>
              {t('homeEditorial.viewRestaurants')}
            </Text>
          </Pressable>
        </View>

        {slides.length ? (
          <View style={styles.bannerFooter}>
            <View style={[styles.slideCaption, { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: theme.radii.md }]}>
              <Text style={[styles.slideDish, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
                {activeSlide?.title}
              </Text>
              <Text style={[styles.slidePlace, { color: theme.colors.textMuted, fontFamily: theme.typography.micro.fontFamily }]}>
                {activeSeller?.brandName}
              </Text>
            </View>
            <View style={styles.dotsRow}>
              {slides.map((slide, index) => (
                <View
                  key={slide.id}
                  style={[
                    styles.dot,
                    index === slideIndex && styles.dotActive,
                    { backgroundColor: index === slideIndex ? '#FFFFFF' : 'rgba(255,255,255,0.55)' },
                  ]}
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <View style={[styles.section, { paddingHorizontal: contentInset }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
          {t('homeEditorial.byCuisine')}
        </Text>
        <View style={styles.cuisineWrap}>
          {availableCuisines.map((cuisine) => (
            <Pressable
              key={cuisine}
              onPress={() => router.push({ pathname: '/search', params: { cuisine } } as never)}
              style={[styles.cuisineTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
              <Text style={[styles.cuisineLabel, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
                {getCuisineLabel(cuisine)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.section, { paddingHorizontal: contentInset }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
          {t('homeEditorial.tonightInBremen')}
        </Text>
        <View style={styles.dishWrap}>
          {mealListings.slice(0, 6).map((listing) => (
            <DishTile key={listing.id} listing={listing} sellerName={getSellerById(listing.sellerId)?.brandName} theme={theme} />
          ))}
        </View>
      </View>

      <View style={[styles.section, { paddingHorizontal: contentInset }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
          {t('home.nearby')}
        </Text>
        <View style={styles.nearbyWrap}>
          {nearbySellers.map((seller) => (
            <NearbyTile key={seller.id} seller={seller} theme={theme} />
          ))}
        </View>
      </View>

      <Pressable
        onPress={() => router.push('/partner' as never)}
        style={[styles.partnerBanner, { backgroundColor: theme.colors.text, marginHorizontal: contentInset, borderRadius: theme.radii.xl }]}>
        <Text style={[styles.partnerTitle, { color: '#FFFFFF', fontFamily: theme.typography.heading.fontFamily }]}>
          {t('homeEditorial.partnerBannerTitle')}
        </Text>
        <View style={[styles.partnerCta, { borderColor: '#FFFFFF', borderRadius: theme.radii.md }]}>
          <Text style={[styles.partnerCtaText, { color: '#FFFFFF', fontFamily: theme.typography.label.fontFamily }]}>
            {t('homeEditorial.partnerBannerCta')}
          </Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

function DishTile({ listing, sellerName, theme }: { listing: Listing; sellerName?: string; theme: AppTheme }) {
  const image = getPrimaryListingImage(listing);
  return (
    <Pressable
      onPress={() => router.push(`/listing/${listing.id}`)}
      style={[styles.dishTile, { backgroundColor: theme.colors.surface, borderRadius: theme.radii.xl }, theme.shadows.sm]}>
      <View style={[styles.dishImage, { backgroundColor: theme.colors.accentTint }]}>
        {image?.url ? <Image contentFit="cover" source={{ uri: image.url }} style={StyleSheet.absoluteFillObject} transition={200} /> : null}
      </View>
      <View style={styles.dishBody}>
        <Text style={[styles.dishName, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]} numberOfLines={1}>
          {listing.title}
        </Text>
        <Text style={[styles.dishSeller, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {sellerName}
        </Text>
        <Text style={[styles.dishPrice, { color: theme.colors.secondaryText, fontFamily: theme.typography.label.fontFamily }]}>
          {formatMoney(listing.price)}
        </Text>
      </View>
    </Pressable>
  );
}

function NearbyTile({ seller, theme }: { seller: SellerProfile; theme: AppTheme }) {
  const cuisineLabel = seller.cuisineSpecialties[0] ? getCuisineLabel(seller.cuisineSpecialties[0]) : undefined;
  return (
    <Pressable
      onPress={() => router.push(`/seller/${seller.id}`)}
      style={[styles.nearbyTile, { backgroundColor: theme.colors.surface, borderRadius: theme.radii.xl }, theme.shadows.sm]}>
      <View style={[styles.nearbyImage, { backgroundColor: theme.colors.accentTint }]}>
        {seller.coverImageUrl ? (
          <Image contentFit="cover" source={{ uri: seller.coverImageUrl }} style={StyleSheet.absoluteFillObject} transition={200} />
        ) : null}
      </View>
      <View style={styles.nearbyBody}>
        <Text style={[styles.nearbyName, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]} numberOfLines={1}>
          {seller.brandName}
        </Text>
        <Text style={[styles.nearbyMeta, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {[cuisineLabel, seller.city].filter(Boolean).join(' · ')}
        </Text>
        <Text style={[styles.nearbyMeta, { color: theme.colors.textMuted }]}>
          {seller.deliveryModes.map((mode) => getDeliveryModeLabel(mode)).join(' + ')}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  banner: { position: 'relative', overflow: 'hidden' },
  heroCard: { position: 'absolute', top: '18%', padding: 28, gap: 12 },
  heroEyebrow: { fontSize: 13, lineHeight: 18, textTransform: 'uppercase', letterSpacing: 0.4 },
  heroTitle: { fontSize: 40, lineHeight: 46 },
  heroAddressRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroAddress: { fontSize: 14, lineHeight: 19 },
  heroCta: { alignSelf: 'flex-start', minHeight: 52, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  heroCtaText: { fontSize: 16, lineHeight: 21 },

  bannerFooter: { position: 'absolute', right: 16, bottom: 16, alignItems: 'flex-end', gap: 8 },
  slideCaption: { paddingHorizontal: 14, paddingVertical: 10, alignItems: 'flex-end' },
  slideDish: { fontSize: 15, lineHeight: 20 },
  slidePlace: { fontSize: 11, lineHeight: 14, marginTop: 2 },
  dotsRow: { flexDirection: 'row', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { width: 18 },

  section: { paddingTop: 40 },
  sectionTitle: { fontSize: 22, lineHeight: 28, marginBottom: 16 },

  cuisineWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cuisineTile: { minWidth: 140, flexGrow: 1, borderWidth: 1, paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  cuisineLabel: { fontSize: 15, lineHeight: 20 },

  dishWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  dishTile: { width: 260, overflow: 'hidden' },
  dishImage: { height: 160 },
  dishBody: { padding: 14, gap: 4 },
  dishName: { fontSize: 16, lineHeight: 21 },
  dishSeller: { fontSize: 13, lineHeight: 18 },
  dishPrice: { fontSize: 16, lineHeight: 21, marginTop: 2 },

  nearbyWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  nearbyTile: { width: 280, overflow: 'hidden' },
  nearbyImage: { height: 140 },
  nearbyBody: { padding: 14, gap: 3 },
  nearbyName: { fontSize: 16, lineHeight: 21 },
  nearbyMeta: { fontSize: 13, lineHeight: 18 },

  partnerBanner: { marginTop: 48, padding: 32, gap: 16, alignItems: 'flex-start' },
  partnerTitle: { fontSize: 24, lineHeight: 30, maxWidth: 480 },
  partnerCta: { minHeight: 48, paddingHorizontal: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  partnerCtaText: { fontSize: 15, lineHeight: 20 },
});
