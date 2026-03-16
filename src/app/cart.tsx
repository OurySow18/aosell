import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/lib/utils/format';
import { useAosell } from '@/providers/aosell-provider';
import { ThemedText } from '@/components/themed-text';

export default function CartScreen() {
  const theme = useTheme();
  const { cart, getListingById, updateCartQuantity, clearCart } = useAosell();

  if (!cart || !cart.items.length) {
    return (
      <AppScreen>
        <EmptyState
          title="Your cart is empty"
          description="AoSell V1 keeps one seller per cart. Add a listing from home or search to start checkout."
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <SectionTitle
        eyebrow="Cart"
        title="One seller, streamlined checkout"
        description="This MVP keeps cart logic simple and makes checkout predictable for pilot launch."
      />

      <View style={styles.list}>
        {cart.items.map((item) => {
          const listing = getListingById(item.listingId);
          return (
            <View
              key={item.listingId}
              style={[styles.row, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={styles.rowCopy}>
                <ThemedText type="headline">{item.titleSnapshot}</ThemedText>
                <ThemedText type="bodySmall" themeColor="textSecondary">
                  {listing?.city} · {listing?.deliveryMode}
                </ThemedText>
              </View>
              <View style={styles.qty}>
                <AppButton
                  label="-"
                  variant="ghost"
                  onPress={() => {
                    void updateCartQuantity(item.listingId, item.quantity - 1);
                  }}
                />
                <ThemedText type="headline">{String(item.quantity)}</ThemedText>
                <AppButton
                  label="+"
                  variant="ghost"
                  onPress={() => {
                    void updateCartQuantity(item.listingId, item.quantity + 1);
                  }}
                />
              </View>
              <ThemedText type="headline">{formatMoney(item.unitPriceSnapshot)}</ThemedText>
            </View>
          );
        })}
      </View>

      <View style={[styles.summary, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <SummaryRow label="Subtotal" value={formatMoney(cart.subtotal)} />
        <SummaryRow label="Delivery" value={formatMoney(cart.deliveryFee)} />
        <SummaryRow label="Total" value={formatMoney(cart.total)} />
        <AppButton label="Continue to checkout" onPress={() => router.push('/checkout')} />
        <AppButton
          label="Clear cart"
          variant="ghost"
          onPress={() => {
            void clearCart();
          }}
        />
      </View>
    </AppScreen>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <ThemedText type="body" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="headline">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.md,
  },
  row: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  rowCopy: {
    gap: Spacing.xs,
  },
  qty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  summary: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
});
