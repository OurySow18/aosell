import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppScreen } from '@/components/ui/app-screen';
import { SectionTitle } from '@/components/ui/section-title';
import { Radius, Spacing } from '@/constants/theme';
import { sellerProfileSchema } from '@/lib/validations/seller-profile';
import { useTheme } from '@/hooks/use-theme';
import { useAosell } from '@/providers/aosell-provider';
import { ThemedText } from '@/components/themed-text';

const sellerTypes = ['shop', 'restaurant', 'individual'] as const;
const deliveryModes = ['aosell', 'seller'] as const;

export default function SellerOnboardingScreen() {
  const theme = useTheme();
  const { createSellerProfile } = useAosell();
  const [type, setType] = useState<(typeof sellerTypes)[number]>('shop');
  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('Berlin');
  const [countryCode, setCountryCode] = useState('DE');
  const [selectedDeliveryModes, setSelectedDeliveryModes] = useState<string[]>(['aosell']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setError(parsed.error.issues[0]?.message ?? 'Seller profile is invalid.');
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
        eyebrow="Seller onboarding"
        title="Build your storefront"
        description="Choose the right seller type, describe your brand clearly, and activate the delivery modes you can actually operate."
      />

      <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <ThemedText type="headline">Seller type</ThemedText>
        <View style={styles.row}>
          {sellerTypes.map((option) => (
            <AppButton
              key={option}
              label={option}
              variant={option === type ? 'secondary' : 'ghost'}
              onPress={() => setType(option)}
            />
          ))}
        </View>
        <AppInput label="Brand name" value={brandName} onChangeText={setBrandName} placeholder="Atelier Nomad" />
        <AppInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="What do you sell and why should people trust your storefront?"
        />
        <View style={styles.row}>
          <AppInput label="City" value={city} onChangeText={setCity} />
          <AppInput label="Country code" value={countryCode} onChangeText={setCountryCode} />
        </View>
        <View style={styles.row}>
          {deliveryModes.map((mode) => (
            <AppButton
              key={mode}
              label={mode}
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
          disabled={isSubmitting}
          label="Create seller profile"
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
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
});
