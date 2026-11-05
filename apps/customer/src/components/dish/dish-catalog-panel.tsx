import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { StatusPill } from '@/components/ui/status-pill';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { filterDishesByCuisines } from '@/lib/dishes';
import { getCuisineLabel } from '@/lib/i18n';
import type { Condiment, Cuisine, Dish } from '@/types/domain';

type DishCatalogPanelProps = {
  cuisines: Cuisine[];
  dishes: Dish[];
  condiments: Condiment[];
  onPick: (dish: Dish) => void;
  onStartNewDish: () => void;
};

export function DishCatalogPanel({ cuisines, dishes, condiments, onPick, onStartNewDish }: DishCatalogPanelProps) {
  const theme = useAppTheme();
  const { t } = useLocale();
  const [expandedDishId, setExpandedDishId] = useState<string>();

  const catalogDishes = filterDishesByCuisines(dishes, cuisines);

  return (
    <View style={styles.wrapper}>
      <View>
        <Text style={[styles.heading, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
          {t('listingEditor.dishSectionTitle')}
        </Text>
        <Text style={[styles.bodySmall, { color: theme.colors.textMuted }]}>{t('listingEditor.dishSectionHint')}</Text>
      </View>

      {catalogDishes.length ? (
        <View style={styles.list}>
          {catalogDishes.map((dish) => {
            const isExpanded = expandedDishId === dish.id;
            const resolvedCondiments = dish.defaultCondimentIds
              .map((id) => condiments.find((condiment) => condiment.id === id)?.name)
              .filter((name): name is string => Boolean(name));

            return (
              <Pressable
                key={dish.id}
                onPress={() => setExpandedDishId((current) => (current === dish.id ? undefined : dish.id))}
                style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.md }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>{dish.name}</Text>
                  <StatusPill label={getCuisineLabel(dish.cuisine)} tone="neutral" />
                </View>
                <Text style={[styles.bodySmall, { color: theme.colors.textMuted }]} numberOfLines={isExpanded ? undefined : 2}>
                  {dish.description}
                </Text>

                {isExpanded ? (
                  <View style={styles.cardExpanded}>
                    {resolvedCondiments.length ? (
                      <View style={styles.chipRow}>
                        {resolvedCondiments.map((name) => (
                          <StatusPill key={name} label={name} tone="neutral" />
                        ))}
                      </View>
                    ) : null}
                    <AppButton label={t('listingEditor.useThisDish')} onPress={() => onPick(dish)} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Text style={[styles.bodySmall, { color: theme.colors.textMuted }]}>{t('listingEditor.noCatalogDishesForCuisine')}</Text>
      )}

      <AppButton label={t('listingEditor.createNewDish')} variant="ghost" onPress={onStartNewDish} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 12 },
  list: { gap: 8 },
  card: { borderWidth: 1, padding: 12, gap: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardExpanded: { marginTop: 8, gap: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  heading: { fontSize: 17, lineHeight: 22 },
  label: { fontSize: 15, lineHeight: 20 },
  bodySmall: { fontSize: 13, lineHeight: 18 },
});
