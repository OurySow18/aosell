import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AosellLogo } from '@/components/brand/aosell-logo';
import { ListingCard } from '@/components/cards/listing-card';
import { SellerCard } from '@/components/cards/seller-card';
import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { SectionTitle } from '@/components/ui/section-title';
import { StatusPill } from '@/components/ui/status-pill';
import { Radius, Spacing } from '@/constants/theme';
import { getListingTypeLabel } from '@/lib/i18n';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/lib/utils/format';
import { getPrimaryListingImage } from '@/lib/utils/listing-media';
import { useAosell } from '@/providers/aosell-provider';
import { ThemedText } from '@/components/themed-text';

export default function HomeScreen() {
  const theme = useTheme();
  const { t } = useLocale();
  const { listings, sellers } = useAosell();
  const quickFilters = [
    { label: t('home.filters.meals'), route: '/search?type=meal' },
    { label: t('home.filters.products'), route: '/search?type=product' },
    { label: t('home.filters.services'), route: '/search?type=service' },
    { label: t('home.filters.aosellDelivery'), route: '/search?deliveryMode=aosell' },
  ];

  const featured = listings.filter((listing) => listing.isFeatured).slice(0, 6);
  const latest = [...listings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const restaurants = listings.filter((listing) => listing.type === 'meal').slice(0, 6);
  const services = listings.filter((listing) => listing.type === 'service').slice(0, 4);
  const shops = sellers.filter((seller) => seller.type === 'shop').slice(0, 4);
  const spotlight = featured[0] ?? latest[0];
  const spotlightImage = spotlight ? getPrimaryListingImage(spotlight) : undefined;
  const spotlightSeller = spotlight ? sellers.find((seller) => seller.id === spotlight.sellerId) : undefined;

  return (
    <AppScreen>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AosellLogo compact />
          <View style={styles.headerText}>
            <ThemedText type="bodySmall" themeColor="textSecondary">
              {t('home.discoveringFrom')}
            </ThemedText>
            <ThemedText type="headline">{t('common.locations.berlinGermany')}</ThemedText>
          </View>
        </View>
        <StatusPill label={t('home.germanyLaunch')} tone="brand" />
      </View>

      <Pressable
        onPress={() => router.push('/search')}
        style={[styles.searchBar, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.searchLeft}>
          <SymbolView
            tintColor={theme.textSecondary}
            size={18}
            name={{ ios: 'magnifyingglass', android: 'search', web: 'magnifyingglass' }}
          />
          <View style={styles.searchCopy}>
            <ThemedText type="button">{t('home.searchPlaceholder')}</ThemedText>
            <ThemedText type="bodySmall" themeColor="textSecondary">
              {t('home.searchHint')}
            </ThemedText>
          </View>
        </View>
        <View style={[styles.searchPill, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="button">{t('common.search')}</ThemedText>
        </View>
      </Pressable>

      <FlatList
        contentContainerStyle={styles.quickFilters}
        data={quickFilters}
        horizontal
        keyExtractor={(item) => item.label}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(item.route as any)}
            style={[styles.quickFilter, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText type="button">{item.label}</ThemedText>
          </Pressable>
        )}
        showsHorizontalScrollIndicator={false}
      />

      {spotlight ? (
        <Pressable
          onPress={() => router.push(`/listing/${spotlight.id}`)}
          style={[
            styles.spotlight,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <View style={[styles.spotlightGlow, { backgroundColor: theme.gold }]} />
          <View style={styles.spotlightCopy}>
            <View style={styles.spotlightTop}>
              <StatusPill label={spotlight.type} tone="brand" />
              <StatusPill label={getListingTypeLabel(spotlight.type)} tone="brand" />
              {spotlightSeller ? (
                <ThemedText type="bodySmall" themeColor="textSecondary">
                  {spotlightSeller.brandName}
                </ThemedText>
              ) : null}
            </View>
            <View style={styles.spotlightBody}>
              <ThemedText type="display">{spotlight.title}</ThemedText>
              <ThemedText type="body" themeColor="textSecondary">
                {spotlight.description}
              </ThemedText>
            </View>
            <View style={styles.spotlightFooter}>
              <ThemedText type="headline">{formatMoney(spotlight.price)}</ThemedText>
              <AppButton label={t('home.viewListing')} onPress={() => router.push(`/listing/${spotlight.id}`)} />
            </View>
          </View>
          <View style={styles.spotlightArt}>
            <View style={[styles.spotlightBloom, { borderColor: theme.gold }]} />
            {spotlightImage?.url ? (
              <View style={styles.spotlightImageFrame}>
                <Image
                  contentFit="cover"
                  source={{ uri: spotlightImage.url }}
                  style={StyleSheet.absoluteFillObject}
                  transition={250}
                />
              </View>
            ) : null}
            {!spotlightImage?.url ? (
              <View style={[styles.spotlightFallback, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText type="headline">{getListingTypeLabel(spotlight.type)}</ThemedText>
              </View>
            ) : null}
          </View>
        </Pressable>
      ) : null}

      <View style={styles.section}>
        <SectionTitle
          eyebrow={t('home.sections.featuredEyebrow')}
          title={t('home.sections.featuredTitle')}
          description={t('home.sections.featuredDescription')}
        />
        <FlatList
          data={featured}
          horizontal
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.horizontalCard}>
              <ListingCard
                listing={item}
                sellerName={sellers.find((seller) => seller.id === item.sellerId)?.brandName}
                onPress={() => router.push(`/listing/${item.id}`)}
              />
            </View>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <View style={styles.section}>
        <SectionTitle
          eyebrow={t('home.sections.restaurantsEyebrow')}
          title={t('home.sections.restaurantsTitle')}
          description={t('home.sections.restaurantsDescription')}
        />
        <FlatList
          data={restaurants}
          horizontal
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.horizontalCard}>
              <ListingCard
                listing={item}
                sellerName={sellers.find((seller) => seller.id === item.sellerId)?.brandName}
                onPress={() => router.push(`/listing/${item.id}`)}
              />
            </View>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <View style={styles.section}>
        <SectionTitle
          eyebrow={t('home.sections.shopsEyebrow')}
          title={t('home.sections.shopsTitle')}
          description={t('home.sections.shopsDescription')}
        />
        <FlatList
          data={shops}
          horizontal
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.horizontalSeller}>
              <SellerCard seller={item} onPress={() => router.push(`/seller/${item.id}`)} />
            </View>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <View style={styles.section}>
        <SectionTitle
          eyebrow={t('home.sections.freshEyebrow')}
          title={t('home.sections.freshTitle')}
          description={t('home.sections.freshDescription')}
        />
        <View style={styles.grid}>
          {latest.map((item) => (
            <View key={item.id} style={styles.gridItem}>
              <ListingCard
                listing={item}
                sellerName={sellers.find((seller) => seller.id === item.sellerId)?.brandName}
                onPress={() => router.push(`/listing/${item.id}`)}
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle
          eyebrow={t('home.sections.servicesEyebrow')}
          title={t('home.sections.servicesTitle')}
          description={t('home.sections.servicesDescription')}
        />
        <View style={styles.grid}>
          {services.map((item) => (
            <View key={item.id} style={styles.gridItem}>
              <ListingCard
                listing={item}
                sellerName={sellers.find((seller) => seller.id === item.sellerId)?.brandName}
                onPress={() => router.push(`/listing/${item.id}`)}
              />
            </View>
          ))}
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  headerCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerText: {
    gap: 2,
  },
  searchBar: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  searchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexBasis: 280,
    flexGrow: 1,
  },
  searchCopy: {
    gap: 2,
  },
  searchPill: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  quickFilters: {
    gap: Spacing.sm,
  },
  quickFilter: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  spotlight: {
    minHeight: 430,
    borderRadius: Radius.large,
    overflow: 'hidden',
    padding: Spacing.xl,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.lg,
    position: 'relative',
  },
  spotlightGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -70,
    left: -60,
    opacity: 0.45,
  },
  spotlightCopy: {
    flexBasis: 300,
    flexGrow: 1,
    gap: Spacing.lg,
    zIndex: 1,
  },
  spotlightTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  spotlightBody: {
    gap: Spacing.md,
  },
  spotlightFooter: {
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  spotlightArt: {
    flexBasis: 260,
    flexGrow: 0.9,
    minWidth: 220,
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  spotlightBloom: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderWidth: 3,
    borderRadius: 74,
    transform: [{ rotate: '18deg' }],
    opacity: 0.75,
  },
  spotlightImageFrame: {
    width: 170,
    height: 170,
    borderRadius: 85,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  spotlightFallback: {
    width: 170,
    height: 170,
    borderRadius: 85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: Spacing.lg,
  },
  horizontalCard: {
    width: 306,
    marginRight: Spacing.md,
  },
  horizontalSeller: {
    width: 300,
    marginRight: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  gridItem: {
    minWidth: 280,
    flexBasis: 320,
    flexGrow: 1,
  },
});
