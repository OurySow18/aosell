import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { StatusPill } from '@/components/ui/status-pill';
import { Radius, Spacing } from '@/constants/theme';
import { getDeliveryModeLabel, getSellerTypeLabel } from '@/lib/i18n';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/lib/utils/format';
import { getPrimaryListingImage } from '@/lib/utils/listing-media';
import { useAosell } from '@/providers/aosell-provider';
import { ThemedText } from '@/components/themed-text';

export default function CartScreen() {
  const theme = useTheme();
  const { t } = useLocale();
  const { cart, getListingById, getSellerById, updateCartQuantity, clearCart } = useAosell();

  if (!cart || !cart.items.length) {
    return (
      <AppScreen>
        <EmptyState
          title={t('cart.emptyTitle')}
          description={t('cart.emptyDescription')}
        />
        <AppButton fullWidth label={t('common.backHome')} onPress={() => router.replace('/home')} />
      </AppScreen>
    );
  }

  const seller = getSellerById(cart.sellerId);
  const itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <AppScreen>
      <SectionTitle
        eyebrow={t('cart.eyebrow')}
        title={t('cart.title')}
        description={t('cart.description')}
      />

      <View style={[styles.hero, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <ThemedText type="title">{seller?.brandName ?? t('cart.selectedStore')}</ThemedText>
            <ThemedText type="body" themeColor="textSecondary">
              {t('cart.itemsReady', { count: itemCount })}
            </ThemedText>
          </View>
          <StatusPill label={t('cart.oneStore')} tone="brand" />
        </View>
        <View style={styles.heroMeta}>
          <StatusPill label={seller ? getSellerTypeLabel(seller.type) : t('auth.seller')} tone="neutral" />
          {seller ? <StatusPill label={`${seller.city}, ${seller.countryCode}`} tone="neutral" /> : null}
          <StatusPill label={formatMoney(cart.total)} tone="warning" />
        </View>
      </View>

      <View style={styles.layout}>
        <View style={styles.itemsColumn}>
          {cart.items.map((item) => {
            const listing = getListingById(item.listingId);
            const previewUrl = item.imageUrl ?? (listing ? getPrimaryListingImage(listing)?.url : undefined);
            const lineTotal = {
              amountCents: item.quantity * item.unitPriceSnapshot.amountCents,
              currency: item.unitPriceSnapshot.currency,
            };

            return (
              <View
                key={item.listingId}
                style={[
                  styles.itemCard,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <View style={[styles.preview, { backgroundColor: theme.backgroundSelected }]}>
                  {previewUrl ? (
                    <Image
                      contentFit="cover"
                      source={{ uri: previewUrl }}
                      style={StyleSheet.absoluteFillObject}
                      transition={200}
                    />
                  ) : null}
                  <View
                    style={[
                      StyleSheet.absoluteFillObject,
                      {
                        backgroundColor: previewUrl ? theme.overlay : theme.backgroundSelected,
                      },
                    ]}
                  />
                </View>

                <View style={styles.itemBody}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemCopy}>
                      <ThemedText type="headline">{item.titleSnapshot}</ThemedText>
                      <ThemedText type="bodySmall" themeColor="textSecondary">
                        {listing?.city ?? seller?.city} ·{' '}
                        {getDeliveryModeLabel(listing?.deliveryMode ?? 'seller')}
                      </ThemedText>
                    </View>
                    <ThemedText type="headline">{formatMoney(lineTotal)}</ThemedText>
                  </View>

                  <View style={styles.itemFooter}>
                    <View style={styles.qtyControls}>
                      <QuantityButton
                        label="-"
                        onPress={() => {
                          void updateCartQuantity(item.listingId, item.quantity - 1);
                        }}
                      />
                      <ThemedText type="headline">{String(item.quantity)}</ThemedText>
                      <QuantityButton
                        label="+"
                        onPress={() => {
                          void updateCartQuantity(item.listingId, item.quantity + 1);
                        }}
                      />
                    </View>
                    <ThemedText type="bodySmall" themeColor="textSecondary">
                      {formatMoney(item.unitPriceSnapshot)} {t('cart.each')}
                    </ThemedText>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.summaryColumn}>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <ThemedText type="headline">{t('cart.orderSummary')}</ThemedText>
            <SummaryRow label={t('common.subtotal')} value={formatMoney(cart.subtotal)} />
            <SummaryRow label={t('common.delivery')} value={formatMoney(cart.deliveryFee)} />
            <SummaryRow label={t('common.total')} value={formatMoney(cart.total)} strong />
            <View
              style={[
                styles.noticeCard,
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}>
              <ThemedText type="label" themeColor="burntOrange">
                {t('cart.checkoutNoteTitle')}
              </ThemedText>
              <ThemedText type="bodySmall" themeColor="textSecondary">
                {t('cart.checkoutNoteDescription')}
              </ThemedText>
            </View>
            <AppButton fullWidth label={t('common.continueToCheckout')} onPress={() => router.push('/checkout')} />
            <AppButton
              fullWidth
              label={t('common.clearCart')}
              variant="ghost"
              onPress={() => {
                void clearCart();
              }}
            />
          </View>
        </View>
      </View>
    </AppScreen>
  );
}

function QuantityButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.qtyButton,
        { backgroundColor: theme.background, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="button">{label}</ThemedText>
    </Pressable>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <ThemedText type="body" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type={strong ? 'title' : 'headline'}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  heroCopy: {
    gap: Spacing.xs,
    flexBasis: 280,
    flexGrow: 1,
  },
  heroMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  layout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    alignItems: 'flex-start',
  },
  itemsColumn: {
    gap: Spacing.md,
    flexBasis: 520,
    flexGrow: 1.3,
    minWidth: 300,
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.lg,
    gap: Spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  preview: {
    width: 110,
    minHeight: 110,
    borderRadius: Radius.medium,
    overflow: 'hidden',
  },
  itemBody: {
    gap: Spacing.md,
    flexBasis: 260,
    flexGrow: 1,
    minWidth: 220,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  itemCopy: {
    gap: Spacing.xs,
    flexBasis: 220,
    flexGrow: 1,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  qtyButton: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryColumn: {
    flexBasis: 320,
    flexGrow: 0.9,
    minWidth: 280,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  noticeCard: {
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
