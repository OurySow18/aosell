import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { Radius, Spacing } from '@/constants/theme';
import { getDeliveryModeLabel, getSellerTypeLabel } from '@/lib/i18n';
import { useLocale } from '@/hooks/use-locale';
import { sellerProfileSchema } from '@/lib/validations/seller-profile';
import { useTheme } from '@/hooks/use-theme';
import { useAosell } from '@/providers/aosell-provider';
import { ThemedText } from '@/components/themed-text';

const sellerTypes = ['shop', 'restaurant', 'individual'] as const;
const deliveryModes = ['aosell', 'seller'] as const;

export default function SellerOnboardingScreen() {
  const theme = useTheme();
  const { t } = useLocale();
  const { currentUser, createSellerProfile } = useAosell();
  const [type, setType] = useState<(typeof sellerTypes)[number]>('shop');
  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('Berlin');
  const [countryCode, setCountryCode] = useState('DE');
  const [selectedDeliveryModes, setSelectedDeliveryModes] = useState<string[]>(['aosell']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser) {
    return (
      <AppScreen>
        <EmptyState
          title={t('sellerOnboarding.noAccountTitle')}
          description={t('sellerOnboarding.noAccountDescription')}
        />
        <AppButton
          label={t('common.createSellerAccount')}
          onPress={() =>
            router.replace({
              pathname: '/auth',
              params: {
                mode: 'signup',
                role: 'seller',
                returnTo: '/seller-onboarding',
              },
            })
          }
        />
      </AppScreen>
    );
  }

  function toggleDeliveryMode(mode: string) {
    setSelectedDeliveryModes((current) =>
      current.includes(mode) ? current.filter((item) => item !== mode) : [...current, mode]
    );
  }

  async function handleSubmit() {
    const parsed = sellerProfileSchema.safeParse({
      type,
      brandName,
      description,
      city,
      countryCode,
      deliveryModes: selectedDeliveryModes,
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
      <SectionTitle
        eyebrow={t('sellerOnboarding.eyebrow')}
        title={t('sellerOnboarding.title')}
        description={t('sellerOnboarding.description')}
      />

      <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={[styles.panelGlow, { backgroundColor: theme.gold }]} />
        <ThemedText type="headline">{t('sellerOnboarding.sellerType')}</ThemedText>
        <View style={styles.row}>
          {sellerTypes.map((option) => (
            <AppButton
              key={option}
              label={getSellerTypeLabel(option)}
              variant={option === type ? 'secondary' : 'ghost'}
              onPress={() => setType(option)}
            />
          ))}
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
        {error ? (
          <ThemedText type="bodySmall" themeColor="error">
            {error}
          </ThemedText>
        ) : null}
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
  panel: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.xl,
    gap: Spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  panelGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -90,
    right: -70,
    opacity: 0.12,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
});
