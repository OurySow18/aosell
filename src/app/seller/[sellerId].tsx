import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CART_DELIVERY_FEE_CENTS } from '@/lib/cart';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { getCuisineLabel } from '@/lib/i18n';
import { formatMoney } from '@/lib/utils/format';
import { getPrimaryListingImage } from '@/lib/utils/listing-media';
import { useAosell } from '@/providers/aosell-provider';
import type { Listing } from '@/types/domain';

type AppTheme = ReturnType<typeof useAppTheme>;

const CART_BAR_HEIGHT = 56;
const CART_BAR_BOTTOM = 96;

export default function SellerProfileScreen() {
  const params = useLocalSearchParams<{ sellerId?: string | string[] }>();
  const sellerId = Array.isArray(params.sellerId) ? params.sellerId[0] : params.sellerId ?? '';
  const theme = useAppTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { getSellerById, listings, cart, addToCart, updateCartQuantity } = useAosell();
  const seller = getSellerById(sellerId);

  const [isFavorite, setIsFavorite] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  if (!seller) {
    return (
      <SafeAreaView style={[styles.notFound, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.notFoundTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
          {t('sellerProfileScreen.notFoundTitle')}
        </Text>
        <Text style={[styles.notFoundBody, { color: theme.colors.textMuted }]}>{t('sellerProfileScreen.notFoundDescription')}</Text>
      </SafeAreaView>
    );
  }

  const sellerListings = listings.filter((listing) => listing.sellerId === seller.id && listing.status === 'active');
  const categories = Array.from(new Set(sellerListings.flatMap((listing) => listing.categories)));
  const tabs = [t('sellerProfileScreen.tabPopular'), ...categories];

  const tabbedListings =
    activeTab === 0
      ? sellerListings.filter((listing) => listing.isFeatured).length
        ? sellerListings.filter((listing) => listing.isFeatured)
        : sellerListings
      : sellerListings.filter((listing) => listing.categories.includes(tabs[activeTab]));

  const visibleListings = searchQuery.trim()
    ? tabbedListings.filter((listing) => listing.title.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : tabbedListings;

  const cuisineLabel = seller.cuisineSpecialties[0] ? getCuisineLabel(seller.cuisineSpecialties[0]) : undefined;
  const cartBelongsHere = cart && cart.sellerId === seller.id && cart.items.length > 0;
  const cartItemCount = cartBelongsHere ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;

  async function handleAdd(listing: Listing) {
    const result = await addToCart(listing.id);
    if (result.requiresAuth) {
      router.push({ pathname: '/auth', params: { mode: 'signup', role: 'buyer' } });
      return;
    }
    if (result.requiresReplace) {
      Alert.alert(t('listingDetail.replaceCartTitle'), t('listingDetail.replaceCartDescription'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.replace'), style: 'destructive', onPress: () => void addToCart(listing.id, true) },
      ]);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: cartBelongsHere ? CART_BAR_BOTTOM + CART_BAR_HEIGHT + 12 : theme.spacing[6] }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}>
        {/* Banner + sheet header */}
        <View>
          <View style={[styles.banner, { backgroundColor: theme.colors.accentTint }]}>
            {seller.coverImageUrl ? (
              <Image contentFit="cover" source={{ uri: seller.coverImageUrl }} style={StyleSheet.absoluteFillObject} transition={200} />
            ) : null}

            <View style={[styles.bannerButtons, { top: insets.top + 8 }]}>
              <RoundButton icon={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} onPress={() => router.back()} theme={theme} />
              <View style={styles.bannerButtonsRight}>
                <RoundButton
                  icon={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                  onPress={() => setIsSearchOpen((current) => !current)}
                  theme={theme}
                />
                <RoundButton
                  icon={isFavorite ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' } : { ios: 'heart', android: 'favorite_border', web: 'favorite_border' }}
                  iconColor={isFavorite ? theme.colors.secondaryStrong : theme.colors.text}
                  onPress={() => setIsFavorite((current) => !current)}
                  theme={theme}
                />
              </View>
            </View>
          </View>

          <View style={[styles.sheet, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.logo, { borderColor: theme.colors.background, backgroundColor: theme.colors.surface }]}>
              {seller.logoUrl ? (
                <Image contentFit="cover" source={{ uri: seller.logoUrl }} style={StyleSheet.absoluteFillObject} />
              ) : (
                <Text style={[styles.logoInitials, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
                  {seller.brandName.slice(0, 2).toUpperCase()}
                </Text>
              )}
            </View>

            <Text style={[styles.sellerName, { color: theme.colors.text, fontFamily: theme.typography.title.fontFamily }]}>
              {seller.brandName}
            </Text>
            <Text style={[styles.sellerMeta, { color: theme.colors.textMuted }]}>
              {[cuisineLabel, seller.city].filter(Boolean).join(' · ')}
            </Text>

            <View
              style={[
                styles.openBadge,
                { backgroundColor: seller.isOpen ? theme.colors.successTint : theme.colors.surfaceMuted },
              ]}>
              <Text
                style={[
                  styles.openBadgeText,
                  { color: seller.isOpen ? theme.colors.success : theme.colors.textMuted, fontFamily: theme.typography.micro.fontFamily },
                ]}>
                {seller.isOpen ? t('sellerProfileScreen.open') : t('sellerProfileScreen.closed')}
              </Text>
            </View>

            <View style={[styles.infoBand, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <InfoCell
                value={seller.ratingAverage ? `★ ${seller.ratingAverage.toFixed(1)}` : '—'}
                label={t('sellerProfileScreen.reviewsCount', { count: seller.ratingCount ?? 0 })}
                theme={theme}
              />
              <View style={[styles.infoDivider, { backgroundColor: theme.colors.border }]} />
              <InfoCell
                value={seller.deliveryModes.includes('aosell') ? t('listingDetail.deliveryHandledByAosell') : t('listingDetail.deliveryHandledBySeller')}
                label={t('sellerProfileScreen.delivery')}
                theme={theme}
              />
              <View style={[styles.infoDivider, { backgroundColor: theme.colors.border }]} />
              <InfoCell value={formatMoney({ amountCents: CART_DELIVERY_FEE_CENTS, currency: 'EUR' })} label={t('sellerProfileScreen.fees')} theme={theme} />
            </View>

            {isSearchOpen ? (
              <View style={[styles.searchInline, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <SymbolView tintColor={theme.colors.textMuted} size={18} name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} />
                <TextInput
                  autoFocus
                  onChangeText={setSearchQuery}
                  placeholder={t('sellerProfileScreen.searchInMenu')}
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.searchInlineInput, { color: theme.colors.text }]}
                  value={searchQuery}
                />
              </View>
            ) : null}
          </View>
        </View>

        {/* Sticky section tabs */}
        <View style={[styles.tabsRow, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {tabs.map((label, index) => (
              <Pressable key={label} onPress={() => setActiveTab(index)} style={styles.tabItem}>
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: activeTab === index ? theme.colors.text : theme.colors.textMuted,
                      fontFamily: activeTab === index ? theme.typography.label.fontFamily : theme.typography.caption.fontFamily,
                    },
                  ]}>
                  {label}
                </Text>
                {activeTab === index ? <View style={[styles.tabUnderline, { backgroundColor: theme.colors.accent }]} /> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Menu */}
        <View style={styles.menuList}>
          {visibleListings.map((listing) => (
            <MenuRow key={listing.id} listing={listing} onAdd={() => void handleAdd(listing)} theme={theme} t={t} />
          ))}
        </View>
      </ScrollView>

      {cartBelongsHere ? (
        <Pressable
          onPress={() => router.push('/cart')}
          style={[
            styles.cartBar,
            { backgroundColor: theme.colors.accent, bottom: CART_BAR_BOTTOM, borderRadius: theme.radii.xl },
            theme.shadows.accent,
          ]}>
          <View style={[styles.cartBarCount, { backgroundColor: theme.colors.text }]}>
            <Text style={[styles.cartBarCountText, { color: theme.colors.accent, fontFamily: theme.typography.label.fontFamily }]}>
              {cartItemCount}
            </Text>
          </View>
          <Text style={[styles.cartBarLabel, { color: theme.colors.onAccent, fontFamily: theme.typography.label.fontFamily }]}>
            {t('sellerProfileScreen.viewCart')}
          </Text>
          <Text style={[styles.cartBarTotal, { color: theme.colors.onAccent, fontFamily: theme.typography.heading.fontFamily }]}>
            {formatMoney(cart.total)}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function RoundButton({
  icon,
  iconColor,
  onPress,
  theme,
}: {
  icon: ComponentProps<typeof SymbolView>['name'];
  iconColor?: string;
  onPress: () => void;
  theme: AppTheme;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.roundButton, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
      <SymbolView tintColor={iconColor ?? theme.colors.text} size={20} name={icon} />
    </Pressable>
  );
}

function InfoCell({ value, label, theme }: { value: string; label: string; theme: AppTheme }) {
  return (
    <View style={styles.infoCell}>
      <Text style={[styles.infoValue, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function MenuRow({
  listing,
  onAdd,
  theme,
  t,
}: {
  listing: Listing;
  onAdd: () => void;
  theme: AppTheme;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const { cart, updateCartQuantity } = useAosell();
  const cartItem = cart?.sellerId === listing.sellerId ? cart.items.find((item) => item.listingId === listing.id) : undefined;
  const image = getPrimaryListingImage(listing);
  const discountPct = listing.compareAtPrice
    ? Math.round((1 - listing.price.amountCents / listing.compareAtPrice.amountCents) * 100)
    : undefined;

  return (
    <View style={[styles.menuRow, { borderBottomColor: theme.colors.surfaceMuted }]}>
      <View style={styles.menuRowInfo}>
        <View style={styles.menuRowNameLine}>
          <Text style={[styles.menuRowName, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]} numberOfLines={1}>
            {listing.title}
          </Text>
          {discountPct && discountPct > 0 ? (
            <View style={[styles.promoBadge, { backgroundColor: theme.colors.secondary }]}>
              <Text style={[styles.promoBadgeText, { color: theme.colors.onSecondary, fontFamily: theme.typography.micro.fontFamily }]}>
                −{discountPct}%
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.menuRowDescription, { color: theme.colors.textMuted }]} numberOfLines={2}>
          {listing.description}
        </Text>
        <View style={styles.menuRowPriceLine}>
          <Text
            style={[
              styles.menuRowPrice,
              { color: discountPct ? theme.colors.secondaryText : theme.colors.text, fontFamily: theme.typography.label.fontFamily },
            ]}>
            {formatMoney(listing.price)}
          </Text>
          {listing.compareAtPrice ? (
            <Text style={[styles.menuRowComparePrice, { color: theme.colors.textMuted }]}>{formatMoney(listing.compareAtPrice)}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.menuRowThumbWrap}>
        <View style={[styles.menuRowThumb, { backgroundColor: theme.colors.accentTint, borderRadius: theme.radii.md }]}>
          {image?.url ? <Image contentFit="cover" source={{ uri: image.url }} style={StyleSheet.absoluteFillObject} transition={200} /> : null}
        </View>

        {cartItem ? (
          <View style={[styles.stepper, { backgroundColor: theme.colors.text, borderRadius: theme.radii.pill }]}>
            <Pressable
              onPress={() => void updateCartQuantity(listing.id, cartItem.quantity - 1)}
              style={styles.stepperButton}>
              <Text style={[styles.stepperButtonText, { color: '#FFFFFF' }]}>−</Text>
            </Pressable>
            <Text style={[styles.stepperValue, { color: '#FFFFFF', fontFamily: theme.typography.label.fontFamily }]}>{cartItem.quantity}</Text>
            <Pressable
              onPress={() => void updateCartQuantity(listing.id, cartItem.quantity + 1)}
              style={styles.stepperButton}>
              <Text style={[styles.stepperButtonText, { color: '#FFFFFF' }]}>+</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={onAdd}
            style={[styles.addPill, { backgroundColor: theme.colors.surface, borderColor: theme.colors.text }]}>
            <Text style={[styles.addPillText, { color: theme.colors.text, fontFamily: theme.typography.micro.fontFamily }]}>
              + {t('common.addToCart')}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  notFoundTitle: { fontSize: 17, lineHeight: 24 },
  notFoundBody: { fontSize: 13, lineHeight: 18, textAlign: 'center' },

  banner: { height: 200, overflow: 'hidden' },
  bannerButtons: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  bannerButtonsRight: { flexDirection: 'row', gap: 10 },
  roundButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  sheet: { marginTop: -36, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 12 },
  logo: { width: 68, height: 68, borderRadius: 34, borderWidth: 4, marginTop: -34, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoInitials: { fontSize: 22, lineHeight: 28 },
  sellerName: { fontSize: 22, lineHeight: 28, marginTop: 10 },
  sellerMeta: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  openBadge: { alignSelf: 'flex-start', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4, marginTop: 10 },
  openBadgeText: { fontSize: 11, lineHeight: 14 },

  infoBand: { flexDirection: 'row', marginTop: 16, borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  infoCell: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 12 },
  infoValue: { fontSize: 15, lineHeight: 20 },
  infoLabel: { fontSize: 11, lineHeight: 14 },
  infoDivider: { width: 1 },

  searchInline: {
    flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, marginTop: 12,
  },
  searchInlineInput: { flex: 1, fontSize: 15 },

  tabsRow: { borderBottomWidth: 1, paddingHorizontal: 20 },
  tabsScroll: { gap: 20 },
  tabItem: { paddingVertical: 12, alignItems: 'center' },
  tabLabel: { fontSize: 15, lineHeight: 20 },
  tabUnderline: { height: 3, width: '100%', borderRadius: 2, marginTop: 8 },

  menuList: { paddingHorizontal: 20 },
  menuRow: { flexDirection: 'row', gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  menuRowInfo: { flex: 1, gap: 4 },
  menuRowNameLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuRowName: { flexShrink: 1, fontSize: 15, lineHeight: 20 },
  promoBadge: { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  promoBadgeText: { fontSize: 11, lineHeight: 14 },
  menuRowDescription: { fontSize: 13, lineHeight: 18 },
  menuRowPriceLine: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2 },
  menuRowPrice: { fontSize: 15, lineHeight: 20 },
  menuRowComparePrice: { fontSize: 13, lineHeight: 18, textDecorationLine: 'line-through' },

  menuRowThumbWrap: { width: 100, alignItems: 'center' },
  menuRowThumb: { width: 100, height: 100, overflow: 'hidden' },
  addPill: { marginTop: -17, height: 34, borderRadius: 17, borderWidth: 1.5, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  addPillText: { fontSize: 12, lineHeight: 15 },
  stepper: { marginTop: -17, height: 34, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, gap: 8 },
  stepperButton: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  stepperButtonText: { fontSize: 16, fontWeight: '700', lineHeight: 18 },
  stepperValue: { fontSize: 14, lineHeight: 18, minWidth: 14, textAlign: 'center' },

  cartBar: {
    position: 'absolute', left: 16, right: 16, height: CART_BAR_HEIGHT, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10,
  },
  cartBarCount: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cartBarCountText: { fontSize: 13, lineHeight: 16 },
  cartBarLabel: { flex: 1, fontSize: 15, lineHeight: 20 },
  cartBarTotal: { fontSize: 17, lineHeight: 22 },
});
