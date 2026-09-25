import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DEFAULT_CITY, DEFAULT_COUNTRY_CODE } from '@/constants/location';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { resolvePromoCode } from '@/lib/cart';
import { getDeliveryModeLabel } from '@/lib/i18n';
import { formatMoney } from '@/lib/utils/format';
import { getPrimaryListingImage } from '@/lib/utils/listing-media';
import { addressSchema } from '@/lib/validations/address';
import { useAosell } from '@/providers/aosell-provider';

type AppTheme = ReturnType<typeof useAppTheme>;

export default function CartScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const {
    currentUser,
    cart,
    addresses,
    getListingById,
    getSellerById,
    updateCartQuantity,
    applyPromoCode,
    addAddress,
    placeOrder,
  } = useAosell();

  const [selectedAddressId, setSelectedAddressId] = useState(addresses.find((item) => item.isDefault)?.id ?? addresses[0]?.id ?? '');
  const [isEditingAddress, setIsEditingAddress] = useState(!selectedAddressId);
  const [draftAddress, setDraftAddress] = useState({
    fullName: '',
    phoneNumber: '',
    line1: '',
    postalCode: '',
    city: DEFAULT_CITY,
    countryCode: DEFAULT_COUNTRY_CODE,
    instructions: '',
  });
  const [addressError, setAddressError] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const [orderError, setOrderError] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  if (!cart || !cart.items.length) {
    return (
      <SafeAreaView style={[styles.emptyRoot, { backgroundColor: theme.colors.background, paddingTop: insets.top + 12 }]}>
        <Text style={[styles.emptyTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
          {t('cart.emptyTitle')}
        </Text>
        <Text style={[styles.emptyBody, { color: theme.colors.textMuted }]}>{t('cart.emptyDescription')}</Text>
        <Pressable
          onPress={() => router.replace('/home')}
          style={[styles.primaryButton, { backgroundColor: theme.colors.accent }, theme.shadows.accent]}>
          <Text style={[styles.primaryButtonText, { color: theme.colors.onAccent, fontFamily: theme.typography.label.fontFamily }]}>
            {t('common.backHome')}
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const seller = getSellerById(cart.sellerId);
  const selectedAddress = addresses.find((item) => item.id === selectedAddressId);
  const firstListingDeliveryMode = getListingById(cart.items[0]?.listingId ?? '')?.deliveryMode;

  async function handleSaveAddress() {
    const parsed = addressSchema.safeParse(draftAddress);
    if (!parsed.success) {
      setAddressError(parsed.error.issues[0]?.message ?? t('checkoutScreen.errors.invalidAddress'));
      return;
    }

    setIsSavingAddress(true);
    const address = await addAddress({ ...parsed.data, isDefault: addresses.length === 0 });
    setIsSavingAddress(false);

    if (!address) {
      setAddressError(t('checkoutScreen.errors.signInToSaveAddress'));
      return;
    }

    setSelectedAddressId(address.id);
    setIsEditingAddress(false);
    setAddressError('');
  }

  async function handleApplyPromo() {
    if (!promoInput.trim()) {
      return;
    }
    setIsApplyingPromo(true);
    const result = await applyPromoCode(promoInput.trim());
    setIsApplyingPromo(false);

    if (!result.ok) {
      setPromoError(t('cart.promoInvalid'));
      return;
    }
    setPromoError('');
    setPromoInput('');
  }

  async function handlePlaceOrder() {
    if (!selectedAddressId) {
      setOrderError(t('checkoutScreen.errors.invalidCheckout'));
      return;
    }

    setOrderError('');
    setIsPlacingOrder(true);
    const order = await placeOrder(selectedAddressId);
    setIsPlacingOrder(false);

    if (order) {
      router.replace(`/checkout/success?orderId=${order.id}`);
    } else {
      setOrderError(t('checkoutScreen.errors.invalidCheckout'));
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.roundButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <SymbolView tintColor={theme.colors.text} size={20} name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={[styles.headerTitle, { color: theme.colors.text, fontFamily: theme.typography.title.fontFamily }]}>
              {t('cart.title')}
            </Text>
            {seller ? (
              <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
                {seller.brandName}
                {firstListingDeliveryMode ? ` · ${getDeliveryModeLabel(firstListingDeliveryMode)}` : ''}
              </Text>
            ) : null}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Items */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
          {cart.items.map((item) => {
            const listing = getListingById(item.listingId);
            const previewUrl = item.imageUrl ?? (listing ? getPrimaryListingImage(listing)?.url : undefined);
            const lineTotal = { amountCents: item.quantity * item.unitPriceSnapshot.amountCents, currency: item.unitPriceSnapshot.currency };

            return (
              <View key={item.listingId} style={styles.itemRow}>
                <View style={[styles.itemThumb, { backgroundColor: theme.colors.accentTint }]}>
                  {previewUrl ? <Image contentFit="cover" source={{ uri: previewUrl }} style={StyleSheet.absoluteFillObject} transition={200} /> : null}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]} numberOfLines={1}>
                    {item.titleSnapshot}
                  </Text>
                  <Text style={[styles.itemPrice, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
                    {formatMoney(lineTotal)}
                  </Text>
                </View>
                <View style={[styles.stepper, { borderColor: theme.colors.borderStrong, borderRadius: theme.radii.pill }]}>
                  <Pressable onPress={() => void updateCartQuantity(item.listingId, item.quantity - 1)} style={styles.stepperButton}>
                    <Text style={[styles.stepperButtonText, { color: theme.colors.text }]}>−</Text>
                  </Pressable>
                  <Text style={[styles.stepperValue, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
                    {item.quantity}
                  </Text>
                  <Pressable onPress={() => void updateCartQuantity(item.listingId, item.quantity + 1)} style={styles.stepperButton}>
                    <Text style={[styles.stepperButtonText, { color: theme.colors.text }]}>+</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        {/* Livraison et paiement */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
          {t('cart.deliveryAndPayment')}
        </Text>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
          <View style={styles.infoRow}>
            <SymbolView tintColor={theme.colors.textMuted} size={18} name={{ ios: 'mappin', android: 'location_on', web: 'location_on' }} />
            <View style={styles.infoRowCopy}>
              {selectedAddress ? (
                <>
                  <Text style={[styles.infoRowPrimary, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
                    {selectedAddress.line1}
                  </Text>
                  <Text style={[styles.infoRowSecondary, { color: theme.colors.textMuted }]}>
                    {selectedAddress.postalCode} {selectedAddress.city}
                  </Text>
                </>
              ) : (
                <Text style={[styles.infoRowPrimary, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
                  {t('cart.noAddress')}
                </Text>
              )}
            </View>
            <Pressable onPress={() => setIsEditingAddress((current) => !current)}>
              <Text style={[styles.linkText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
                {t('common.modify')}
              </Text>
            </Pressable>
          </View>

          <View style={[styles.rowDivider, { backgroundColor: theme.colors.surfaceMuted }]} />

          <View style={styles.infoRow}>
            <SymbolView tintColor={theme.colors.textMuted} size={18} name={{ ios: 'creditcard', android: 'credit_card', web: 'credit_card' }} />
            <View style={styles.infoRowCopy}>
              <Text style={[styles.infoRowPrimary, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
                {t('cart.paymentAtOrder')}
              </Text>
              <Text style={[styles.infoRowSecondary, { color: theme.colors.textMuted }]}>{t('cart.paymentAtOrderHint')}</Text>
            </View>
          </View>

          {isEditingAddress ? (
            <View style={styles.addressForm}>
              {addresses.length ? (
                <View style={styles.addressChoices}>
                  {addresses.map((address) => (
                    <Pressable
                      key={address.id}
                      onPress={() => {
                        setSelectedAddressId(address.id);
                        setIsEditingAddress(false);
                      }}
                      style={[
                        styles.addressChoice,
                        {
                          borderColor: selectedAddressId === address.id ? theme.colors.text : theme.colors.border,
                          borderWidth: selectedAddressId === address.id ? 1.5 : 1,
                        },
                      ]}>
                      <Text style={[styles.infoRowPrimary, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
                        {address.fullName}
                      </Text>
                      <Text style={[styles.infoRowSecondary, { color: theme.colors.textMuted }]}>
                        {address.line1}, {address.postalCode} {address.city}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <FormField label={t('common.fullName')} value={draftAddress.fullName} onChangeText={(value) => setDraftAddress((current) => ({ ...current, fullName: value }))} theme={theme} />
              <FormField label={t('common.phone')} value={draftAddress.phoneNumber} onChangeText={(value) => setDraftAddress((current) => ({ ...current, phoneNumber: value }))} theme={theme} />
              <FormField label={t('common.street')} value={draftAddress.line1} onChangeText={(value) => setDraftAddress((current) => ({ ...current, line1: value }))} theme={theme} />
              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <FormField label={t('common.postalCode')} value={draftAddress.postalCode} onChangeText={(value) => setDraftAddress((current) => ({ ...current, postalCode: value }))} theme={theme} />
                </View>
                <View style={styles.fieldHalf}>
                  <FormField label={t('common.city')} value={draftAddress.city} onChangeText={(value) => setDraftAddress((current) => ({ ...current, city: value }))} theme={theme} />
                </View>
              </View>

              {addressError ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{addressError}</Text> : null}

              <Pressable
                disabled={isSavingAddress}
                onPress={() => void handleSaveAddress()}
                style={[styles.secondaryButton, { borderColor: theme.colors.text }]}>
                {isSavingAddress ? (
                  <ActivityIndicator color={theme.colors.text} />
                ) : (
                  <Text style={[styles.secondaryButtonText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
                    {t('common.saveAddress')}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* Promo code */}
        <View
          style={[
            styles.promoCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: cart.promoCode ? theme.colors.success : theme.colors.border,
              borderRadius: theme.radii.lg,
            },
          ]}>
          {cart.promoCode ? (
            <View style={styles.promoApplied}>
              <SymbolView tintColor={theme.colors.success} size={18} name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }} />
              <View>
                <Text style={[styles.infoRowPrimary, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
                  {cart.promoCode}
                </Text>
                <Text style={[styles.infoRowSecondary, { color: theme.colors.success }]}>
                  {t('cart.promoApplied', {
                    amount: formatMoney(cart.discount),
                    label: cart.promoCode && resolvePromoCode(cart.promoCode) ? t(resolvePromoCode(cart.promoCode)!.labelKey) : '',
                  })}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.promoInputRow}>
              <TextInput
                autoCapitalize="characters"
                onChangeText={setPromoInput}
                placeholder={t('cart.promoPlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.promoInput, { color: theme.colors.text }]}
                value={promoInput}
              />
              <Pressable
                disabled={isApplyingPromo || !promoInput.trim()}
                onPress={() => void handleApplyPromo()}
                style={[styles.promoButton, { backgroundColor: theme.colors.text }]}>
                {isApplyingPromo ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={[styles.promoButtonText, { color: '#FFFFFF', fontFamily: theme.typography.label.fontFamily }]}>
                    {t('cart.promoApply')}
                  </Text>
                )}
              </Pressable>
            </View>
          )}
          {promoError ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{promoError}</Text> : null}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <SummaryRow label={t('common.subtotal')} value={formatMoney(cart.subtotal)} theme={theme} />
          <SummaryRow label={t('common.delivery')} value={formatMoney(cart.deliveryFee)} theme={theme} />
          {cart.discount.amountCents > 0 ? (
            <SummaryRow label={t('cart.discount')} value={`−${formatMoney(cart.discount)}`} theme={theme} tone="success" />
          ) : null}
          <View style={[styles.rowDivider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
              {t('common.total')}
            </Text>
            <Text style={[styles.totalValue, { color: theme.colors.text, fontFamily: theme.typography.title.fontFamily }]}>
              {formatMoney(cart.total)}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border, paddingBottom: 14 + insets.bottom },
        ]}>
        {orderError ? <Text style={[styles.errorText, { color: theme.colors.error, marginBottom: 8 }]}>{orderError}</Text> : null}
        <Pressable
          disabled={isPlacingOrder || !selectedAddressId}
          onPress={() => void handlePlaceOrder()}
          style={[
            styles.orderButton,
            { backgroundColor: theme.colors.accent, opacity: !selectedAddressId ? theme.motion.disabledOpacity : 1 },
            theme.shadows.accent,
          ]}>
          {isPlacingOrder ? (
            <ActivityIndicator color={theme.colors.onAccent} />
          ) : (
            <Text style={[styles.orderButtonText, { color: theme.colors.onAccent, fontFamily: theme.typography.label.fontFamily }]}>
              {t('cart.orderCta', { total: formatMoney(cart.total) })}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  theme,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  theme: AppTheme;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <TextInput
        onChangeText={onChangeText}
        style={[styles.fieldInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
        value={value}
      />
    </View>
  );
}

function SummaryRow({ label, value, theme, tone }: { label: string; value: string; theme: AppTheme; tone?: 'success' }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: tone === 'success' ? theme.colors.success : theme.colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  emptyRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 17, lineHeight: 24 },
  emptyBody: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  primaryButton: { height: 56, minWidth: 200, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  primaryButtonText: { fontSize: 17, lineHeight: 22 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 12 },
  roundButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { gap: 1 },
  headerTitle: { fontSize: 22, lineHeight: 28 },
  headerSubtitle: { fontSize: 13, lineHeight: 18 },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 32, gap: 16 },
  card: { borderWidth: 1, padding: 14, gap: 4 },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  itemThumb: { width: 52, height: 52, borderRadius: 12, overflow: 'hidden' },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 15, lineHeight: 20 },
  itemPrice: { fontSize: 15, lineHeight: 20 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, height: 36, paddingHorizontal: 4, gap: 10 },
  stepperButton: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  stepperButtonText: { fontSize: 17, lineHeight: 19 },
  stepperValue: { fontSize: 15, lineHeight: 20, minWidth: 16, textAlign: 'center' },

  sectionTitle: { fontSize: 17, lineHeight: 24, marginTop: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10 },
  infoRowCopy: { flex: 1, gap: 2 },
  infoRowPrimary: { fontSize: 15, lineHeight: 20 },
  infoRowSecondary: { fontSize: 13, lineHeight: 18 },
  linkText: { fontSize: 13, lineHeight: 18, textDecorationLine: 'underline' },
  rowDivider: { height: 1 },

  addressForm: { marginTop: 8, gap: 10 },
  addressChoices: { gap: 8 },
  addressChoice: { borderRadius: 12, padding: 10 },
  fieldRow: { flexDirection: 'row', gap: 10 },
  fieldHalf: { flex: 1 },
  fieldWrap: { gap: 4 },
  fieldLabel: { fontSize: 12, lineHeight: 16 },
  fieldInput: { height: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 14 },
  errorText: { fontSize: 12, lineHeight: 16 },
  secondaryButton: { height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { fontSize: 13, lineHeight: 18 },

  promoCard: { borderWidth: 1, padding: 14, gap: 6 },
  promoApplied: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  promoInputRow: { flexDirection: 'row', gap: 8 },
  promoInput: { flex: 1, height: 44, fontSize: 14 },
  promoButton: { height: 44, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  promoButtonText: { fontSize: 13, lineHeight: 18 },

  summary: { gap: 8, paddingTop: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 15, lineHeight: 22 },
  summaryValue: { fontSize: 15, lineHeight: 22 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { fontSize: 17, lineHeight: 24 },
  totalValue: { fontSize: 22, lineHeight: 28 },

  footer: { borderTopWidth: 1, paddingTop: 14, paddingHorizontal: 20 },
  orderButton: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  orderButtonText: { fontSize: 17, lineHeight: 22 },
});
