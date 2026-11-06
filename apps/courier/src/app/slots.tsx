import { CourierRepository, getIntlLocale } from '@aosell/core';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/bottom-nav';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/lib/i18n';
import { useCourierAuth } from '@/providers/courier-auth';

const SLOT_DAYS_COUNT = 7;

function nextDays(count: number) {
  const days: Date[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const day = new Date(base);
    day.setDate(base.getDate() + i);
    days.push(day);
  }
  return days;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function SlotsScreen() {
  const theme = useAppTheme();
  const { t, locale } = useLocale();
  const { courierProfile } = useCourierAuth();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  if (!courierProfile) {
    return <Redirect href="/" />;
  }

  const plannedDates = new Set(courierProfile.plannedAvailabilityDates ?? []);
  const days = nextDays(SLOT_DAYS_COUNT);

  async function toggleDay(key: string) {
    const current = new Set(courierProfile!.plannedAvailabilityDates ?? []);
    if (current.has(key)) {
      current.delete(key);
    } else {
      current.add(key);
    }
    setPendingKey(key);
    try {
      await CourierRepository.setPlannedAvailability(courierProfile!.id, Array.from(current));
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.heading }]}>{t('slots.title')}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{t('slots.subtitle')}</Text>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.body}>
        {days.map((day) => {
          const key = toDateKey(day);
          const isOn = plannedDates.has(key);
          const label = day.toLocaleDateString(getIntlLocale(locale), { weekday: 'long', day: 'numeric', month: 'short' });
          return (
            <View key={key} style={[styles.row, { borderBottomColor: theme.colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dayLabel, { color: theme.colors.text }]}>{label}</Text>
                <Text style={[styles.dayStatus, { color: isOn ? theme.colors.success : theme.colors.textMuted }]}>
                  {isOn ? t('slots.available') : t('slots.unavailable')}
                </Text>
              </View>
              {pendingKey === key ? (
                <ActivityIndicator color={theme.colors.accent} />
              ) : (
                <Switch
                  onValueChange={() => void toggleDay(key)}
                  thumbColor={theme.colors.surface}
                  trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                  value={isOn}
                />
              )}
            </View>
          );
        })}
      </ScrollView>

      <BottomNav active="slots" theme={theme} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerArea: { paddingHorizontal: 20, paddingBottom: 16, gap: 6 },
  title: { fontSize: 22 },
  subtitle: { fontSize: 13, lineHeight: 19 },
  body: { paddingHorizontal: 20, paddingBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  dayLabel: { fontSize: 15, fontWeight: '600', textTransform: 'capitalize' },
  dayStatus: { fontSize: 12, marginTop: 2 },
});
