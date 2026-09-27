import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { DEFAULT_CITY, DEFAULT_COUNTRY_CODE } from '@/constants/location';
import { getCuisineLabel, getDeliveryModeLabel, getSellerTypeLabel } from '@/lib/i18n';
import { useLocale } from '@/hooks/use-locale';
import { cuisineOptions, sellerProfileSchema } from '@/lib/validations/seller-profile';
import { useAppTheme } from '@/hooks/use-theme';
import { useAosell } from '@/providers/aosell-provider';
import type { Cuisine } from '@/types/domain';

const sellerTypes = ['shop', 'restaurant', 'individual'] as const;
const deliveryModes = ['aosell', 'seller'] as const;

export default function SellerOnboardingScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const { currentUser, createSellerProfile } = useAosell();
  const [type, setType] = useState<(typeof sellerTypes)[number]>('shop');
  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState(DEFAULT_CITY);
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [selectedDeliveryModes, setSelectedDeliveryModes] = useState<string[]>(['aosell']);
  const [cuisineSpecialties, setCuisineSpecialties] = useState<Cuisine[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser) {
    return (
      <AppScreen>
        <EmptyState title={t('sellerOnboarding.noAccountTitle')} description={t('sellerOnboarding.noAccountDescription')} />
        <AppButton
          label={t('common.createSellerAccount')}
          onPress={() =>
            router.replace({ pathname: '/auth', params: { mode: 'signup', role: 'seller', returnTo: '/seller-onboarding' } })
          }
        />
      </AppScreen>
    );
  }

  function toggleDeliveryMode(mode: string) {
    setSelectedDeliveryModes((current) => (current.includes(mode) ? current.filter((item) => item !== mode) : [...current, mode]));
  }

  function toggleCuisine(cuisine: Cuisine) {
    setCuisineSpecialties((current) => (current.includes(cuisine) ? current.filter((item) => item !== cuisine) : [...current, cuisine]));
  }

  async function handleSubmit() {
    const parsed = sellerProfileSchema.safeParse({
      type,
      brandName,
      description,
      city,
      countryCode,
      deliveryModes: selectedDeliveryModes,
      cuisineSpecialties,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('sellerOnboarding.invalid'));
      return;
    }

    setIsSubmitting(true);
    try {
      const profile = await createSellerProfile(parsed.data);
      if (profile) {
        router.replace('/seller-center');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppScreen>
      <SectionTitle eyebrow={t('sellerOnboarding.eyebrow')} title={t('sellerOnboarding.title')} description={t('sellerOnboarding.description')} />

      <View style={[styles.panel, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
        <Text style={[styles.heading, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
          {t('sellerOnboarding.sellerType')}
        </Text>
        <View style={styles.row}>
          {sellerTypes.map((option) => (
            <AppButton key={option} label={getSellerTypeLabel(option)} variant={option === type ? 'secondary' : 'ghost'} onPress={() => setType(option)} />
          ))}
        </View>
        <View style={styles.cuisineBlock}>
          <Text style={[styles.heading, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
            {t('sellerOnboarding.cuisineSpecialtiesTitle')}
          </Text>
          <Text style={[styles.bodySmall, { color: theme.colors.textMuted }]}>{t('sellerOnboarding.cuisineSpecialtiesHint')}</Text>
          <View style={styles.row}>
            {cuisineOptions.map((cuisine) => (
              <AppButton
                key={cuisine}
                label={getCuisineLabel(cuisine)}
                variant={cuisineSpecialties.includes(cuisine) ? 'secondary' : 'ghost'}
                onPress={() => toggleCuisine(cuisine)}
              />
            ))}
          </View>
        </View>
        <AppInput label={t('sellerOnboarding.brandName')} value={brandName} onChangeText={setBrandName} placeholder={t('sellerOnboarding.brandPlaceholder')} />
        <AppInput
          label={t('sellerOnboarding.descriptionLabel')}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder={t('sellerOnboarding.descriptionPlaceholder')}
        />
        <View style={styles.row}>
          <AppInput label={t('common.city')} value={city} onChangeText={setCity} />
          <AppInput label={t('common.countryCode')} value={countryCode} onChangeText={setCountryCode} />
        </View>
        <View style={styles.row}>
          {deliveryModes.map((mode) => (
            <AppButton
              key={mode}
              label={getDeliveryModeLabel(mode)}
              variant={selectedDeliveryModes.includes(mode) ? 'secondary' : 'ghost'}
              onPress={() => toggleDeliveryMode(mode)}
            />
          ))}
        </View>
        {error ? <Text style={[styles.bodySmall, { color: theme.colors.error }]}>{error}</Text> : null}
        <AppButton
          fullWidth
          disabled={isSubmitting}
          label={t('common.createSellerProfile')}
          onPress={() => {
            void handleSubmit();
          }}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1, padding: 20, gap: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cuisineBlock: { gap: 8 },
  heading: { fontSize: 17, lineHeight: 22 },
  bodySmall: { fontSize: 13, lineHeight: 18 },
});
