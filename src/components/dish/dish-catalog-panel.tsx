import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { StatusPill } from '@/components/ui/status-pill';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
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
  const theme = useTheme();
  const { t } = useLocale();
  const [expandedDishId, setExpandedDishId] = useState<string>();

  const catalogDishes = filterDishesByCuisines(dishes, cuisines);

  return (
    <View style={styles.wrapper}>
      <View>
        <ThemedText type="headline">{t('listingEditor.dishSectionTitle')}</ThemedText>
        <ThemedText type="bodySmall" themeColor="textSecondary">
          {t('listingEditor.dishSectionHint')}
        </ThemedText>
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
                style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <View style={styles.cardHeader}>
                  <ThemedText type="button">{dish.name}</ThemedText>
                  <StatusPill label={getCuisineLabel(dish.cuisine)} tone="neutral" />
                </View>
                <ThemedText type="bodySmall" themeColor="textSecondary" numberOfLines={isExpanded ? undefined : 2}>
                  {dish.description}
                </ThemedText>

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
        <ThemedText type="bodySmall" themeColor="textSecondary">
          {t('listingEditor.noCatalogDishesForCuisine')}
        </ThemedText>
      )}

      <AppButton label={t('listingEditor.createNewDish')} variant="ghost" onPress={onStartNewDish} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.md,
  },
  list: {
    gap: Spacing.sm,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cardExpanded: {
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
});
