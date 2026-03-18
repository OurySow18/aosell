import { StyleSheet, View } from 'react-native';

import type { OrderStatus } from '@/types/domain';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getOrderProgressSteps } from '@/lib/utils/order-status';

export function OrderStatusTrack({
  status,
  timelineStatuses = [],
}: {
  status: OrderStatus;
  timelineStatuses?: OrderStatus[];
}) {
  const theme = useTheme();
  const steps = getOrderProgressSteps(status, timelineStatuses);

  return (
    <View style={styles.list}>
      {steps.map((step, index) => {
        const isComplete = step.state === 'complete';
        const isCurrent = step.state === 'current';
        const dotColor = isComplete
          ? theme.success
          : isCurrent
            ? theme.earth
            : theme.backgroundSelected;
        const lineColor = isComplete ? theme.success : theme.border;

        return (
          <View key={step.status} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.dot, { backgroundColor: dotColor, borderColor: lineColor }]} />
              {index < steps.length - 1 ? (
                <View style={[styles.line, { backgroundColor: lineColor }]} />
              ) : null}
            </View>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isCurrent ? theme.background : theme.backgroundElement,
                  borderColor: isCurrent ? theme.earth : theme.border,
                },
              ]}>
              <ThemedText type="button">{step.label}</ThemedText>
              <ThemedText type="bodySmall" themeColor="textSecondary">
                {step.description}
              </ThemedText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'stretch',
  },
  rail: {
    width: 18,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: Radius.pill,
    borderWidth: 2,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: Spacing.xs,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
});
