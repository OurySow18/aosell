import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { StatusPill } from '@/components/ui/status-pill';
import { Radius, Spacing } from '@/constants/theme';
import { DEFAULT_CITY, DEFAULT_COUNTRY_CODE } from '@/constants/location';
import { getSellerTypeLabel } from '@/lib/i18n';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/lib/utils/format';
import { getPrimaryListingImage } from '@/lib/utils/listing-media';
import { addressSchema } from '@/lib/validations/address';
import { checkoutSchema } from '@/lib/validations/checkout';
import { useAosell } from '@/providers/aosell-provider';
import { ThemedText } from '@/components/themed-text';

export default function CheckoutScreen() {
  const theme = useTheme();
  const { t } = useLocale();
  const { cart, addresses, addAddress, placeOrder, getListingById, getSellerById } = useAosell();
  const checkoutSteps = [
    {
      description: t('checkoutScreen.steps.addressDescription'),
      label: t('checkoutScreen.steps.addressLabel'),
      step: '01',
    },
    {
      description: t('checkoutScreen.steps.reviewDescription'),
      label: t('checkoutScreen.steps.reviewLabel'),
      step: '02',
    },
    {
      description: t('checkoutScreen.steps.paymentDescription'),
      label: t('checkoutScreen.steps.paymentLabel'),
      step: '03',
    },
  ];
  const [selectedAddressId, setSelectedAddressId] = useState(addresses[0]?.id ?? '');
  const [draftAddress, setDraftAddress] = useState({
    fullName: '',
    phoneNumber: '',
    line1: '',
    postalCode: '',
    city: DEFAULT_CITY,
    countryCode: DEFAULT_COUNTRY_CODE,
    instructions: '',
  });
  const [error, setError] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  useEffect(() => {
    if (!selectedAddressId && addresses[0]?.id) {
      setSelectedAddressId(addresses[0].id);
    }
  }, [addresses, selectedAddressId]);

  if (!cart) {
    return (
      <AppScreen>
        <EmptyState title={t('checkoutScreen.noCartTitle')} description={t('checkoutScreen.noCartDescription')} />
        <AppButton label={t('common.backToCart')} onPress={() => router.replace('/cart')} />
      </AppScreen>
    );
  }

  const seller = getSellerById(cart.sellerId);

  async function handleAddAddress() {
    const parsed = addressSchema.safeParse(draftAddress);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('checkoutScreen.errors.invalidAddress'));
      return;
    }

    setIsSavingAddress(true);
    const address = await addAddress({
      ...parsed.data,
      isDefault: false,
    });
    setIsSavingAddress(false);

    if (!address) {
      setError(t('checkoutScreen.errors.signInToSaveAddress'));
      return;
    }

    setSelectedAddressId(address.id);
    setDraftAddress({
      fullName: '',
      phoneNumber: '',
      line1: '',
      postalCode: '',
      city: DEFAULT_CITY,
      countryCode: DEFAULT_COUNTRY_CODE,
      instructions: '',
    });
    setError('');
  }

  async function handlePay() {
    const validation = checkoutSchema.safeParse({
      addressId: selectedAddressId,
      sellerId: cart.sellerId,
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? t('checkoutScreen.errors.invalidCheckout'));
      return;
    }

    setIsSubmittingOrder(true);
    const order = await placeOrder(selectedAddressId);
    setIsSubmittingOrder(false);

    if (order) {
      router.replace(`/checkout/success?orderId=${order.id}`);
    }
  }

  return (
    <AppScreen>
      <SectionTitle
        eyebrow={t('checkoutScreen.eyebrow')}
        title={t('checkoutScreen.title')}
        description={t('checkoutScreen.description')}
      />

      <View style={styles.stepRow}>
        {checkoutSteps.map((item) => (
          <View
            key={item.step}
            style={[
              styles.stepCard,
              {
                backgroundColor: item.step === '03' ? theme.backgroundSelected : theme.backgroundElement,
                borderColor: item.step === '03' ? theme.earth : theme.border,
              },
            ]}>
            <ThemedText type="label" themeColor="burntOrange">
              {item.step}
            </ThemedText>
            <ThemedText type="headline">{item.label}</ThemedText>
            <ThemedText type="bodySmall" themeColor="textSecondary">
              {item.description}
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.layout}>
        <View style={styles.mainColumn}>
          <View
            style={[
              styles.panel,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <View style={styles.panelHeader}>
              <ThemedText type="headline">{t('checkoutScreen.selectAddress')}</ThemedText>
              <StatusPill
                label={selectedAddressId ? t('checkoutScreen.addressSelected') : t('checkoutScreen.addressNeeded')}
                tone={selectedAddressId ? 'success' : 'warning'}
              />
            </View>

            {addresses.length ? (
              <View style={styles.addressList}>
                {addresses.map((address) => {
                  const selected = selectedAddressId === address.id;
                  return (
                    <Pressable
                      key={address.id}
                      onPress={() => setSelectedAddressId(address.id)}
                      style={[
                        styles.addressCard,
                        {
                          backgroundColor: selected ? theme.background : theme.backgroundElement,
                          borderColor: selected ? theme.earth : theme.border,
                        },
                      ]}>
                      <View style={styles.addressHeader}>
                        <ThemedText type="headline">{address.fullName}</ThemedText>
                        {selected ? <StatusPill label={t('common.selected')} tone="brand" /> : null}
                      </View>
                      <ThemedText type="bodySmall" themeColor="textSecondary">
                        {address.line1}, {address.postalCode} {address.city}
                      </ThemedText>
                      <ThemedText type="bodySmall" themeColor="textSecondary">
                        {address.phoneNumber}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <ThemedText type="body" themeColor="textSecondary">
                {t('checkoutScreen.noAddressYet')}
              </ThemedText>
            )}
          </View>

          <View
            style={[
              styles.panel,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <ThemedText type="headline">{t('checkoutScreen.addAddress')}</ThemedText>
            <AppInput
              label={t('common.fullName')}
              value={draftAddress.fullName}
              onChangeText={(value) => setDraftAddress((current) => ({ ...current, fullName: value }))}
            />
            <AppInput
              label={t('common.phone')}
              value={draftAddress.phoneNumber}
              onChangeText={(value) => setDraftAddress((current) => ({ ...current, phoneNumber: value }))}
            />
            <AppInput
              label={t('common.street')}
              value={draftAddress.line1}
              onChangeText={(value) => setDraftAddress((current) => ({ ...current, line1: value }))}
            />
            <View style={styles.inlineFields}>
              <View style={styles.field}>
                <AppInput
                  label={t('common.postalCode')}
                  value={draftAddress.postalCode}
                  onChangeText={(value) =>
                    setDraftAddress((current) => ({ ...current, postalCode: value }))
                  }
                />
              </View>
              <View style={styles.field}>
                <AppInput
                  label={t('common.city')}
                  value={draftAddress.city}
                  onChangeText={(value) => setDraftAddress((current) => ({ ...current, city: value }))}
                />
              </View>
            </View>
            <AppInput
              label={t('common.deliveryNote')}
              value={draftAddress.instructions}
              onChangeText={(value) =>
                setDraftAddress((current) => ({ ...current, instructions: value }))
              }
              placeholder={t('checkoutScreen.deliveryNotePlaceholder')}
            />
            <AppButton
              disabled={isSavingAddress}
              fullWidth
              label={t('common.saveAddress')}
              variant="ghost"
              onPress={() => {
                void handleAddAddress();
              }}
            />
          </View>
        </View>

        <View style={styles.summaryColumn}>
          <View
            style={[
              styles.panel,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
              <View style={styles.panelHeader}>
                <View style={styles.panelCopy}>
                <ThemedText type="headline">{seller?.brandName ?? t('checkoutScreen.selectedSeller')}</ThemedText>
                <ThemedText type="bodySmall" themeColor="textSecondary">
                  {seller?.city ?? t('checkoutScreen.sellerCity')} · {seller ? getSellerTypeLabel(seller.type) : t('auth.seller')}
                </ThemedText>
              </View>
              <StatusPill label={t('checkoutScreen.orderReview')} tone="brand" />
            </View>

            <View style={styles.lineItems}>
              {cart.items.map((item) => {
                const listing = getListingById(item.listingId);
                const previewUrl = item.imageUrl ?? (listing ? getPrimaryListingImage(listing)?.url : undefined);
                const lineTotal = {
                  amountCents: item.quantity * item.unitPriceSnapshot.amountCents,
                  currency: item.unitPriceSnapshot.currency,
                };

                return (
                  <View key={item.listingId} style={styles.lineItem}>
                    <View style={[styles.linePreview, { backgroundColor: theme.backgroundSelected }]}>
                      {previewUrl ? (
                        <Image
                          contentFit="cover"
                          source={{ uri: previewUrl }}
                          style={StyleSheet.absoluteFillObject}
                          transition={200}
                        />
                      ) : null}
                    </View>
                    <View style={styles.lineCopy}>
                      <ThemedText type="button">{item.titleSnapshot}</ThemedText>
                      <ThemedText type="bodySmall" themeColor="textSecondary">
                        {t('checkoutScreen.qtyEach', {
                          count: item.quantity,
                          price: formatMoney(item.unitPriceSnapshot),
                        })}
                      </ThemedText>
                    </View>
                    <ThemedText type="button">{formatMoney(lineTotal)}</ThemedText>
                  </View>
                );
              })}
            </View>

            <SummaryRow label={t('common.subtotal')} value={formatMoney(cart.subtotal)} />
            <SummaryRow label={t('common.delivery')} value={formatMoney(cart.deliveryFee)} />
            <SummaryRow label={t('common.total')} value={formatMoney(cart.total)} strong />
          </View>

          <View
            style={[
              styles.panel,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <ThemedText type="headline">{t('checkoutScreen.paymentTitle')}</ThemedText>
            <ThemedText type="body" themeColor="textSecondary">
              {t('checkoutScreen.paymentDescription')}
            </ThemedText>
            <View
              style={[
                styles.paymentNotes,
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}>
              <ThemedText type="bodySmall" themeColor="textSecondary">
                {t('checkoutScreen.paymentNoteOne')}
              </ThemedText>
              <ThemedText type="bodySmall" themeColor="textSecondary">
                {t('checkoutScreen.paymentNoteTwo')}
              </ThemedText>
            </View>
            {error ? (
              <ThemedText type="bodySmall" themeColor="error">
                {error}
              </ThemedText>
            ) : null}
            <AppButton
              disabled={isSubmittingOrder || !selectedAddressId}
              fullWidth
              label={t('common.continueToPayment')}
              onPress={() => {
                void handlePay();
              }}
            />
          </View>
        </View>
      </View>
    </AppScreen>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <ThemedText type="body" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type={strong ? 'title' : 'headline'}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  stepCard: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.lg,
    gap: Spacing.xs,
    minWidth: 180,
    flexBasis: 220,
    flexGrow: 1,
  },
  layout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    alignItems: 'flex-start',
  },
  mainColumn: {
    flexBasis: 520,
    flexGrow: 1.2,
    minWidth: 300,
    gap: Spacing.lg,
  },
  summaryColumn: {
    flexBasis: 320,
    flexGrow: 0.9,
    minWidth: 280,
    gap: Spacing.lg,
  },
  panel: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  panelCopy: {
    gap: Spacing.xs,
  },
  addressList: {
    gap: Spacing.md,
  },
  addressCard: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  inlineFields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  field: {
    minWidth: 180,
    flexGrow: 1,
  },
  lineItems: {
    gap: Spacing.md,
  },
  lineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  linePreview: {
    width: 56,
    height: 56,
    borderRadius: Radius.medium,
    overflow: 'hidden',
  },
  lineCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    alignItems: 'center',
  },
  paymentNotes: {
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.md,
  },
});
