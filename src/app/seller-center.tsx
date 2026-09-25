import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { computeDailyOrderStats } from '@/lib/orders';
import { formatMoney } from '@/lib/utils/format';
import { getOrderStatusLabel } from '@/lib/utils/order-status';
import { useAosell } from '@/providers/aosell-provider';
import type { Listing, Order } from '@/types/domain';

type AppTheme = ReturnType<typeof useAppTheme>;

export default function SellerCenterScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { currentUser, currentSellerProfile, listings, orders, advanceOrderStatus, saveListing, setSellerOpen } = useAosell();

  if (!currentUser || !currentSellerProfile) {
    return (
      <SafeAreaView style={[styles.notFound, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.notFoundTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
          {t('sellerCenterScreen.createProfileTitle')}
        </Text>
        <Text style={[styles.notFoundBody, { color: theme.colors.textMuted }]}>{t('sellerCenterScreen.createProfileDescription')}</Text>
      </SafeAreaView>
    );
  }

  const sellerListings = listings.filter((listing) => listing.sellerId === currentSellerProfile.id);
  const sellerOrders = orders.filter((order) => order.sellerId === currentSellerProfile.id);
  const stats = computeDailyOrderStats(sellerOrders);

  const toProcess = sellerOrders.filter((order) => order.status === 'paid');
  const inProgress = sellerOrders.filter((order) => order.status === 'confirmed' || order.status === 'preparing');
  const outOfStock = sellerListings.filter((listing) => !listing.inventory.isUnlimited && (listing.inventory.quantity ?? 0) <= 0);

  async function handleRestock(listing: Listing) {
    await saveListing({
      id: listing.id,
      title: listing.title,
      slug: listing.slug,
      description: listing.description,
      amountCents: listing.price.amountCents,
      type: listing.type,
      deliveryMode: listing.deliveryMode,
      city: listing.city,
      countryCode: listing.countryCode,
      status: 'active',
      tags: listing.tags,
      categories: listing.categories,
      hasVideo: Boolean(listing.linkedVideoUrl),
      dishSelection: { kind: 'none' },
      condimentInputs: listing.condiments.map((entry) => entry.nameSnapshot),
    });
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.roundButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <SymbolView tintColor={theme.colors.text} size={20} name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={[styles.headerEyebrow, { color: theme.colors.textMuted }]}>
              {t('sellerCenterScreen.eyebrowDated', { date: new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date()) })}
            </Text>
            <Text style={[styles.headerTitle, { color: theme.colors.text, fontFamily: theme.typography.title.fontFamily }]}>
              {currentSellerProfile.brandName}
            </Text>
          </View>
          <View style={styles.openToggle}>
            <Text
              style={[
                styles.openLabel,
                { color: currentSellerProfile.isOpen ? theme.colors.success : theme.colors.textMuted, fontFamily: theme.typography.label.fontFamily },
              ]}>
              {currentSellerProfile.isOpen ? t('sellerCenterScreen.open') : t('sellerCenterScreen.closed')}
            </Text>
            <Switch
              onValueChange={(value) => void setSellerOpen(value)}
              thumbColor="#FFFFFF"
              trackColor={{ false: theme.colors.borderStrong, true: theme.colors.success }}
              value={Boolean(currentSellerProfile.isOpen)}
            />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 + insets.bottom, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{t('sellerCenterScreen.ordersToday')}</Text>
            <Text style={[styles.statValue, { color: theme.colors.text, fontFamily: theme.typography.display.fontFamily }]}>{stats.count}</Text>
            {stats.deltaPct !== null ? (
              <Text style={[styles.statDelta, { color: stats.deltaPct >= 0 ? theme.colors.success : theme.colors.error }]}>
                {stats.deltaPct >= 0 ? '+' : ''}
                {stats.deltaPct}% {t('sellerCenterScreen.vsLastWeek')}
              </Text>
            ) : null}
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{t('sellerCenterScreen.revenueToday')}</Text>
            <Text style={[styles.statValue, { color: theme.colors.text, fontFamily: theme.typography.display.fontFamily }]}>
              {formatMoney({ amountCents: stats.revenueCents, currency: 'EUR' })}
            </Text>
            <Text style={[styles.statDelta, { color: theme.colors.textMuted }]}>
              {t('sellerCenterScreen.avgBasket', { amount: formatMoney({ amountCents: stats.avgBasketCents, currency: 'EUR' }) })}
            </Text>
          </View>
        </View>

        {/* To process */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
            {t('sellerCenterScreen.toProcess')}
          </Text>
          <Text style={[styles.sectionCount, { color: theme.colors.textMuted }]}>
            {t('sellerCenterScreen.allCount', { count: toProcess.length + inProgress.length })}
          </Text>
        </View>

        {toProcess.map((order) => (
          <NewOrderCard
            key={order.id}
            onAccept={() => void advanceOrderStatus(order.id, 'confirmed')}
            onReject={() => void advanceOrderStatus(order.id, 'canceled')}
            order={order}
            theme={theme}
            t={t}
          />
        ))}
        {inProgress.map((order) => (
          <InProgressOrderCard key={order.id} order={order} theme={theme} />
        ))}
        {!toProcess.length && !inProgress.length ? (
          <Text style={[styles.emptyHint, { color: theme.colors.textMuted }]}>{t('sellerCenterScreen.nothingToProcess')}</Text>
        ) : null}

        {/* Out of stock */}
        {outOfStock.length ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
                {t('sellerCenterScreen.outOfStock')}
              </Text>
              <View style={[styles.errorBadge, { backgroundColor: theme.colors.errorTint }]}>
                <Text style={[styles.errorBadgeText, { color: theme.colors.error, fontFamily: theme.typography.micro.fontFamily }]}>
                  {t('sellerCenterScreen.productsCount', { count: outOfStock.length })}
                </Text>
              </View>
            </View>
            {outOfStock.map((listing) => (
              <View key={listing.id} style={[styles.stockRow, { borderColor: theme.colors.border }]}>
                <View style={[styles.stockThumb, { backgroundColor: theme.colors.surfaceMuted }]} />
                <View style={styles.stockCopy}>
                  <Text style={[styles.infoRowPrimary, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]} numberOfLines={1}>
                    {listing.title}
                  </Text>
                  <Text style={[styles.infoRowSecondary, { color: theme.colors.textMuted }]}>{formatMoney(listing.price)}</Text>
                </View>
                <Switch onValueChange={() => void handleRestock(listing)} thumbColor="#FFFFFF" trackColor={{ false: theme.colors.borderStrong, true: theme.colors.success }} value={false} />
              </View>
            ))}
          </>
        ) : null}

        {/* Listings */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
            {t('sellerCenterScreen.listings')}
          </Text>
          <Pressable onPress={() => router.push('/listing/edit/new')}>
            <Text style={[styles.linkText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
              {t('common.createListing')}
            </Text>
          </Pressable>
        </View>
        {sellerListings.map((listing) => (
          <Pressable
            key={listing.id}
            onPress={() => router.push(`/listing/edit/${listing.id}`)}
            style={[styles.listingRow, { borderColor: theme.colors.border }]}>
            <Text style={[styles.infoRowPrimary, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily, flex: 1 }]} numberOfLines={1}>
              {listing.title}
            </Text>
            <Text style={[styles.infoRowSecondary, { color: theme.colors.textMuted }]}>{formatMoney(listing.price)}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function NewOrderCard({
  order,
  onAccept,
  onReject,
  theme,
  t,
}: {
  order: Order;
  onAccept: () => void;
  onReject: () => void;
  theme: AppTheme;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const summary = order.items.map((item) => `${item.quantity}× ${item.titleSnapshot}`).join(' · ');

  return (
    <View style={[styles.orderCard, { borderColor: theme.colors.text, backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg }]}>
      <View style={styles.orderCardHeader}>
        <Text style={[styles.orderId, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>#{order.id.slice(0, 7)}</Text>
        <View style={[styles.newBadge, { backgroundColor: theme.colors.accent }]}>
          <Text style={[styles.newBadgeText, { color: theme.colors.onAccent, fontFamily: theme.typography.micro.fontFamily }]}>
            {t('sellerCenterScreen.newOrder')}
          </Text>
        </View>
      </View>
      <Text style={[styles.orderSummary, { color: theme.colors.text }]} numberOfLines={2}>
        {summary} · {formatMoney(order.total)}
      </Text>
      <View style={styles.orderActions}>
        <Pressable onPress={onReject} style={[styles.rejectButton, { borderColor: theme.colors.borderStrong }]}>
          <Text style={[styles.rejectButtonText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
            {t('sellerCenterScreen.reject')}
          </Text>
        </Pressable>
        <Pressable onPress={onAccept} style={[styles.acceptButton, { backgroundColor: theme.colors.accent }]}>
          <Text style={[styles.acceptButtonText, { color: theme.colors.onAccent, fontFamily: theme.typography.label.fontFamily }]}>
            {t('sellerCenterScreen.accept')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function InProgressOrderCard({ order, theme }: { order: Order; theme: AppTheme }) {
  const summary = order.items.map((item) => `${item.quantity}× ${item.titleSnapshot}`).join(' · ');

  return (
    <Pressable
      onPress={() => router.push(`/orders/${order.id}`)}
      style={[styles.orderCard, styles.inProgressCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg }]}>
      <View style={styles.orderCardHeader}>
        <Text style={[styles.orderId, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>#{order.id.slice(0, 7)}</Text>
        <View style={[styles.alertBadge, { backgroundColor: theme.colors.warningTint }]}>
          <Text style={[styles.alertBadgeText, { color: theme.colors.warning, fontFamily: theme.typography.micro.fontFamily }]}>
            {getOrderStatusLabel(order.status)}
          </Text>
        </View>
      </View>
      <Text style={[styles.orderSummary, { color: theme.colors.text }]} numberOfLines={1}>
        {summary}
      </Text>
      <SymbolView tintColor={theme.colors.textMuted} size={16} name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  notFoundTitle: { fontSize: 17, lineHeight: 24 },
  notFoundBody: { fontSize: 13, lineHeight: 18, textAlign: 'center' },

  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 12 },
  roundButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, gap: 1 },
  headerEyebrow: { fontSize: 13, lineHeight: 18 },
  headerTitle: { fontSize: 22, lineHeight: 28 },
  openToggle: { alignItems: 'center', gap: 4 },
  openLabel: { fontSize: 11, lineHeight: 14 },

  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderWidth: 1, padding: 16, gap: 2 },
  statLabel: { fontSize: 12, lineHeight: 16 },
  statValue: { fontSize: 24, lineHeight: 30, marginTop: 2 },
  statDelta: { fontSize: 11, lineHeight: 14, marginTop: 2 },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  sectionTitle: { fontSize: 17, lineHeight: 24 },
  sectionCount: { fontSize: 13, lineHeight: 18 },
  linkText: { fontSize: 13, lineHeight: 18, textDecorationLine: 'underline' },
  emptyHint: { fontSize: 13, lineHeight: 18 },

  orderCard: { borderWidth: 1.5, padding: 14, gap: 8 },
  inProgressCard: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  orderCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderId: { fontSize: 14, lineHeight: 18 },
  newBadge: { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  newBadgeText: { fontSize: 11, lineHeight: 14 },
  alertBadge: { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  alertBadgeText: { fontSize: 11, lineHeight: 14 },
  orderSummary: { fontSize: 14, lineHeight: 20, flex: 1 },
  orderActions: { flexDirection: 'row', gap: 10 },
  rejectButton: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  rejectButtonText: { fontSize: 14, lineHeight: 18 },
  acceptButton: { flex: 2, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  acceptButtonText: { fontSize: 14, lineHeight: 18 },

  errorBadge: { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  errorBadgeText: { fontSize: 11, lineHeight: 14 },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1 },
  stockThumb: { width: 40, height: 40, borderRadius: 10 },
  stockCopy: { flex: 1, gap: 1 },
  infoRowPrimary: { fontSize: 14, lineHeight: 18 },
  infoRowSecondary: { fontSize: 12, lineHeight: 16 },

  listingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
});
