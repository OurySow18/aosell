import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { Radius, Spacing } from '@/constants/theme';
import { listingSchema } from '@/lib/validations/listing';
import { useTheme } from '@/hooks/use-theme';
import { useAosell } from '@/providers/aosell-provider';
import { ThemedText } from '@/components/themed-text';

const listingTypes = ['product', 'meal', 'service'] as const;
const listingStatuses = ['draft', 'active', 'paused', 'hidden', 'archived'] as const;
const deliveryModes = ['aosell', 'seller'] as const;

export default function ListingEditorScreen() {
  const params = useLocalSearchParams<{ listingId?: string | string[] }>();
  const listingId = Array.isArray(params.listingId) ? params.listingId[0] : params.listingId ?? 'new';
  const theme = useTheme();
  const { currentSellerProfile, getListingById, saveListing } = useAosell();
  const existing = listingId === 'new' ? undefined : getListingById(listingId);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [slug, setSlug] = useState(existing?.slug ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [amount, setAmount] = useState(String(existing?.price.amountCents ?? 0));
  const [type, setType] = useState<(typeof listingTypes)[number]>(existing?.type ?? 'product');
  const [deliveryMode, setDeliveryMode] = useState<(typeof deliveryModes)[number]>(existing?.deliveryMode ?? 'aosell');
  const [city, setCity] = useState(existing?.city ?? currentSellerProfile?.city ?? 'Berlin');
  const [countryCode, setCountryCode] = useState(existing?.countryCode ?? currentSellerProfile?.countryCode ?? 'DE');
  const [status, setStatus] = useState<(typeof listingStatuses)[number]>(existing?.status ?? 'draft');
  const [tags, setTags] = useState(existing?.tags.join(', ') ?? '');
  const [categories, setCategories] = useState(existing?.categories.join(', ') ?? '');
  const [hasVideo, setHasVideo] = useState(Boolean(existing?.linkedVideoUrl));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentSellerProfile) {
    return (
      <AppScreen>
        <EmptyState
          title="Seller profile missing"
          description="Create your storefront before creating or editing listings."
        />
      </AppScreen>
    );
  }

  async function handleSave() {
    const parsed = listingSchema.safeParse({
      title,
      slug,
      description,
      amountCents: Number(amount),
      type,
      deliveryMode,
      city,
      countryCode,
      status,
      tags: tags
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      categories: categories
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      hasVideo,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Listing is invalid.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await saveListing({
        id: existing?.id,
        ...parsed.data,
      });

      if (result) {
        router.replace('/seller-center');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppScreen>
      <SectionTitle
        eyebrow="Listing editor"
        title={existing ? 'Edit listing' : 'Create listing'}
        description="One image minimum, one optional video, and up to ten total media items. This editor keeps the form simple and ready for Firebase Storage wiring."
      />

      <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <AppInput label="Title" value={title} onChangeText={setTitle} />
        <AppInput label="Slug" value={slug} onChangeText={setSlug} />
        <AppInput label="Description" value={description} onChangeText={setDescription} multiline />
        <AppInput label="Price in cents" value={amount} onChangeText={setAmount} />
        <View style={styles.row}>
          {listingTypes.map((option) => (
            <AppButton
              key={option}
              label={option}
              variant={type === option ? 'secondary' : 'ghost'}
              onPress={() => setType(option)}
            />
          ))}
        </View>
        <View style={styles.row}>
          {deliveryModes.map((option) => (
            <AppButton
              key={option}
              label={option}
              variant={deliveryMode === option ? 'secondary' : 'ghost'}
              onPress={() => setDeliveryMode(option)}
            />
          ))}
        </View>
        <View style={styles.row}>
          {listingStatuses.map((option) => (
            <AppButton
              key={option}
              label={option}
              variant={status === option ? 'secondary' : 'ghost'}
              onPress={() => setStatus(option)}
            />
          ))}
        </View>
        <View style={styles.row}>
          <AppInput label="City" value={city} onChangeText={setCity} />
          <AppInput label="Country code" value={countryCode} onChangeText={setCountryCode} />
        </View>
        <AppInput label="Tags" value={tags} onChangeText={setTags} placeholder="culture, featured, meal" />
        <AppInput
          label="Categories"
          value={categories}
          onChangeText={setCategories}
          placeholder="Dinner, Decor, Repair"
        />
        <AppButton
          label={hasVideo ? 'Video included' : 'Add optional video'}
          variant={hasVideo ? 'secondary' : 'ghost'}
          onPress={() => setHasVideo((current) => !current)}
        />
        {error ? (
          <ThemedText type="bodySmall" themeColor="error">
            {error}
          </ThemedText>
        ) : null}
        <AppButton
          disabled={isSubmitting}
          label={existing ? 'Save changes' : 'Publish listing'}
          onPress={() => {
            void handleSave();
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
