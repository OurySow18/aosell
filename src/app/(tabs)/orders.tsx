import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { StatusPill } from '@/components/ui/status-pill';
import { Radius, Spacing } from '@/constants/theme';
import { formatDate, formatMoney, formatStatus } from '@/lib/utils/format';
import { useTheme } from '@/hooks/use-theme';
import { useAosell } from '@/providers/aosell-provider';
import { ThemedText } from '@/components/themed-text';

export default function OrdersScreen() {
  const theme = useTheme();
  const { currentUser, orders, sellers } = useAosell();

  if (!currentUser) {
    return (
      <AppScreen>
        <EmptyState
          title="No account connected"
          description="Sign in to see buyer orders or move into seller operations."
        />
      </AppScreen>
    );
  }

  const userOrders = orders.filter((order) => order.buyerUserId === currentUser.id);

  if (!userOrders.length) {
    return (
      <AppScreen>
        <EmptyState
          title="No orders yet"
          description="Once checkout is completed, your order timeline and payment state will show up here."
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <SectionTitle
        eyebrow="Orders"
        title="Track every step"
        description="Statuses follow the Firestore transition rules: created, payment, confirmation, preparation, delivery, and completion."
      />
      <View style={styles.list}>
        {userOrders.map((order) => (
          <Pressable
            key={order.id}
            style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            onPress={() => router.push(`/orders/${order.id}`)}>
            <View style={styles.header}>
              <View style={styles.copy}>
                <ThemedText type="headline">{order.id}</ThemedText>
                <ThemedText type="bodySmall" themeColor="textSecondary">
                  {sellers.find((seller) => seller.id === order.sellerId)?.brandName}
                </ThemedText>
              </View>
              <StatusPill label={formatStatus(order.status)} tone="brand" />
            </View>
            <View style={styles.footer}>
              <ThemedText type="bodySmall" themeColor="textSecondary">
                {formatDate(order.createdAt)}
              </ThemedText>
              <ThemedText type="headline">{formatMoney(order.total)}</ThemedText>
            </View>
          </Pressable>
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.md,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  copy: {
    gap: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
