import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ListingCard } from '@/components/cards/listing-card';
import { SellerCard } from '@/components/cards/seller-card';
import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/lib/utils/format';
import { getPrimaryListingImage } from '@/lib/utils/listing-media';
import { useAosell } from '@/providers/aosell-provider';

export default function HomeScreen() {
  const theme = useTheme();
  const { t } = useLocale();
  const { listings, sellers } = useAosell();

  const featured = listings.filter((listing) => listing.isFeatured).slice(0, 6);
  const latest = [...listings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const shops = sellers.slice(0, 4);
  const spotlight = featured[0] ?? latest[0];
  const spotlightImage = spotlight ? getPrimaryListingImage(spotlight) : undefined;
  const spotlightSeller = spotlight ? sellers.find((seller) => seller.id === spotlight.sellerId) : undefined;

  const categories = [
    {
      accent: theme.burntOrange,
      surface: '#FBE5DC',
      icon: { ios: 'fork.knife', android: 'restaurant', web: 'restaurant' } as const,
      label: t('home.filters.meals'),
      route: '/search?type=meal',
    },
    {
      accent: theme.gold,
      surface: '#FFF1D2',
      icon: { ios: 'bag.fill', android: 'shopping_bag', web: 'shopping_bag' } as const,
      label: t('home.filters.products'),
      route: '/search?type=product',
    },
    {
      accent: theme.forestGreen,
      surface: '#E3F0E7',
      icon: { ios: 'sparkles', android: 'handyman', web: 'handyman' } as const,
      label: t('home.filters.services'),
      route: '/search?type=service',
    },
  ];

  return (
    <AppScreen>
      <Pressable
        onPress={() => router.push('/search')}
        style={[
          styles.locationRow,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        <View
          style={[
            styles.locationIcon,
            { backgroundColor: '#FFF1D2', borderColor: theme.border },
          ]}>
          <SymbolView
            tintColor={theme.burntOrange}
            size={18}
            name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }}
          />
        </View>
        <View style={styles.locationCopy}>
          <ThemedText type="label" themeColor="textSecondary">
            {t('home.discoveringFrom')}
          </ThemedText>
          <ThemedText type="headline">{t('common.locations.bremenGermany')}</ThemedText>
        </View>
        <SymbolView
          tintColor={theme.text}
          size={18}
          name={{ ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }}
        />
      </Pressable>

      <View style={styles.categories}>
        {categories.map((item) => (
          <Pressable
            key={item.label}
            onPress={() => router.push(item.route as never)}
            style={({ pressed }) => [
              styles.category,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              pressed && styles.pressed,
            ]}>
            <View style={styles.categoryTop}>
              <View style={[styles.categoryIcon, { backgroundColor: item.surface }]}>
                <SymbolView tintColor={item.accent} size={21} name={item.icon} />
              </View>
              <SymbolView
                tintColor={item.accent}
                size={16}
                name={{ ios: 'arrow.up.right', android: 'north_east', web: 'north_east' }}
              />
            </View>
            <ThemedText type="button" numberOfLines={2} style={{ color: theme.text }}>
              {item.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {spotlight ? (
        <Pressable
          onPress={() => router.push(`/listing/${spotlight.id}`)}
          style={[styles.hero, { backgroundColor: theme.earth }, Shadows.float]}>
          {spotlightImage?.url ? (
            <Image
              contentFit="cover"
              source={{ uri: spotlightImage.url }}
              style={StyleSheet.absoluteFillObject}
              transition={250}
            />
          ) : null}
          <View style={styles.heroOverlay} />
          <View style={styles.heroTop}>
            <View style={[styles.heroBadge, { backgroundColor: theme.accent }]}>
              <ThemedText type="label" style={{ color: theme.earth }}>
                {t('home.sections.featuredEyebrow')}
              </ThemedText>
            </View>
            <View style={styles.heroArrow}>
              <SymbolView
                tintColor="#FFFFFF"
                size={20}
                name={{ ios: 'arrow.up.right', android: 'north_east', web: 'north_east' }}
              />
            </View>
          </View>
          <View style={styles.heroContent}>
            {spotlightSeller ? (
              <ThemedText type="button" style={styles.heroSeller}>
                {spotlightSeller.brandName} · {spotlight.city}
              </ThemedText>
            ) : null}
            <ThemedText type="display" style={styles.heroTitle} numberOfLines={2}>
              {spotlight.title}
            </ThemedText>
            <View style={styles.heroFooter}>
              <ThemedText type="title" style={{ color: '#FFFFFF' }}>
                {formatMoney(spotlight.price)}
              </ThemedText>
              <View style={[styles.heroCta, { backgroundColor: theme.burntOrange }]}>
                <ThemedText type="button" style={{ color: '#FFFFFF' }}>
                  {t('home.viewListing')}
                </ThemedText>
              </View>
            </View>
          </View>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => router.push('/search')}
          style={[styles.emptyHero, { backgroundColor: theme.earth }]}>
          <View style={[styles.emptyHeroOrb, { backgroundColor: theme.gold }]} />
          <View style={[styles.emptyHeroOrbTwo, { backgroundColor: theme.forestGreen }]} />
          <View style={styles.emptyHeroCopy}>
            <ThemedText type="label" style={{ color: theme.accent }}>
              {t('home.sections.freshEyebrow')}
            </ThemedText>
            <ThemedText type="display" style={styles.emptyHeroTitle}>
              {t('home.sections.freshTitle')}
            </ThemedText>
            <ThemedText type="body" style={{ color: '#F1E5DF' }}>
              {t('home.sections.freshDescription')}
            </ThemedText>
          </View>
          <View style={[styles.heroCta, { backgroundColor: theme.accent, alignSelf: 'flex-start' }]}>
            <ThemedText type="button" style={{ color: theme.earth }}>
              {t('common.search')}
            </ThemedText>
          </View>
        </Pressable>
      )}

      {featured.length ? (
        <>
          <SectionHeader
            eyebrow={t('home.sections.featuredEyebrow')}
            title={t('home.sections.featuredTitle')}
            onPress={() => router.push('/search')}
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
        </>
      ) : null}

      <View style={[styles.discoveryBand, { backgroundColor: theme.forestGreen }]}>
        <View style={[styles.discoveryOrb, { backgroundColor: theme.accent }]} />
        <View style={styles.discoveryCopy}>
          <ThemedText type="label" style={{ color: '#FFFFFF' }}>
            {t('home.sections.shopsEyebrow')}
          </ThemedText>
          <ThemedText type="title" style={{ color: '#FFFFFF' }}>
            {t('home.sections.shopsTitle')}
          </ThemedText>
          <ThemedText type="body" style={{ color: '#E5F2E8' }}>
            {t('home.sections.shopsDescription')}
          </ThemedText>
        </View>
      </View>

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

      {latest.length ? (
        <>
          <SectionHeader
            eyebrow={t('home.sections.freshEyebrow')}
            title={t('home.sections.freshTitle')}
            onPress={() => router.push('/search')}
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
        </>
      ) : null}
    </AppScreen>
  );
}

function SectionHeader({
  eyebrow,
  title,
  onPress,
}: {
  eyebrow: string;
  title: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionCopy}>
        <ThemedText type="label" themeColor="burntOrange">
          {eyebrow}
        </ThemedText>
        <ThemedText type="title">{title}</ThemedText>
      </View>
      <Pressable
        onPress={onPress}
        style={[styles.sectionArrow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <SymbolView
          tintColor={theme.text}
          size={18}
          name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 72,
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.md,
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  locationCopy: {
    flex: 1,
    gap: 1,
  },
  categories: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  category: {
    minWidth: 0,
    minHeight: 104,
    flex: 1,
    borderRadius: Radius.medium,
    borderWidth: 1,
    padding: Spacing.sm,
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  categoryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  categoryIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    minHeight: 340,
    borderRadius: Radius.xlarge,
    overflow: 'hidden',
    padding: Spacing.xl,
    justifyContent: 'space-between',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(53, 21, 12, 0.52)',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroBadge: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  heroArrow: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(53,21,12,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    gap: Spacing.md,
    zIndex: 1,
  },
  emptyHero: {
    minHeight: 290,
    borderRadius: Radius.xlarge,
    padding: Spacing.xl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    gap: Spacing.lg,
  },
  emptyHeroCopy: {
    gap: Spacing.sm,
    maxWidth: 560,
    zIndex: 1,
  },
  emptyHeroTitle: {
    color: '#FFFFFF',
    fontSize: 38,
    lineHeight: 42,
  },
  emptyHeroOrb: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    right: -50,
    top: -70,
    opacity: 0.2,
  },
  emptyHeroOrbTwo: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    right: 100,
    top: 120,
    opacity: 0.24,
  },
  heroSeller: {
    color: '#FFFFFF',
  },
  heroTitle: {
    color: '#FFFFFF',
    maxWidth: 620,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  heroCta: {
    minHeight: 48,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  sectionCopy: {
    gap: Spacing.xs,
    flex: 1,
  },
  sectionArrow: {
    width: 46,
    height: 46,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalCard: {
    width: 292,
    marginRight: Spacing.md,
  },
  discoveryBand: {
    minHeight: 150,
    borderRadius: Radius.xlarge,
    padding: Spacing.xl,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  discoveryOrb: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -40,
    top: -60,
    opacity: 0.22,
  },
  discoveryCopy: {
    maxWidth: 520,
    gap: Spacing.sm,
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
    flexBasis: 300,
    flexGrow: 1,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
