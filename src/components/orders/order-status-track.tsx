import { StyleSheet, Text, View } from 'react-native';

import type { OrderStatus } from '@/types/domain';

import { useAppTheme } from '@/hooks/use-theme';
import { getOrderProgressSteps } from '@/lib/utils/order-status';

export function OrderStatusTrack({
  status,
  timelineStatuses = [],
}: {
  status: OrderStatus;
  timelineStatuses?: OrderStatus[];
}) {
  const theme = useAppTheme();
  const steps = getOrderProgressSteps(status, timelineStatuses);

  return (
    <View style={styles.list}>
      {steps.map((step, index) => {
        const isComplete = step.state === 'complete';
        const isCurrent = step.state === 'current';
        const dotColor = isComplete ? theme.colors.success : isCurrent ? theme.colors.text : theme.colors.surfaceMuted;
        const lineColor = isComplete ? theme.colors.success : theme.colors.border;

        return (
          <View key={step.status} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.dot, { backgroundColor: dotColor, borderColor: lineColor }]} />
              {index < steps.length - 1 ? <View style={[styles.line, { backgroundColor: lineColor }]} /> : null}
            </View>
            <View
              style={[
                styles.card,
                {
                  borderRadius: theme.radii.lg,
                  backgroundColor: isCurrent ? theme.colors.accentTint : theme.colors.surface,
                  borderColor: isCurrent ? theme.colors.text : theme.colors.border,
                },
              ]}>
              <Text style={[styles.stepLabel, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
                {step.label}
              </Text>
              <Text style={[styles.stepDescription, { color: theme.colors.textMuted }]}>{step.description}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
  rail: { width: 18, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  line: { width: 2, flex: 1, marginTop: 4 },
  card: { flex: 1, borderWidth: 1, padding: 14, gap: 4 },
  stepLabel: { fontSize: 15, lineHeight: 20 },
  stepDescription: { fontSize: 13, lineHeight: 18 },
});
