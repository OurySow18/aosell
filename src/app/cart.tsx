import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { lazy, Suspense, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DEFAULT_CITY, DEFAULT_COUNTRY_CODE } from '@/constants/location';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { resolvePromoCode } from '@/lib/cart';
import { getDeliveryModeLabel } from '@/lib/i18n';
import { formatMoney } from '@/lib/utils/format';
import { getPrimaryListingImage } from '@/lib/utils/listing-media';
import { addressSchema } from '@/lib/validations/address';
import { useAosell } from '@/providers/aosell-provider';

type AppTheme = ReturnType<typeof useAppTheme>;

const PayOrderButton = lazy(() => import('@/components/payments/pay-order-button'));

export default function CartScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const breakpoint = useBreakpoint();
  const isWideLayout = Platform.OS === 'web' && breakpoint !== 'mobile';
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

  async function handlePlaceOrderForPayment() {
    if (!selectedAddressId) {
      setOrderError(t('checkoutScreen.errors.invalidCheckout'));
      return null;
    }

    setOrderError('');
    const order = await placeOrder(selectedAddressId);
    if (!order) {
      setOrderError(t('checkoutScreen.errors.invalidCheckout'));
    }
    return order;
  }

  const itemsCard = (
    <>
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
                <QuantityStepper
                  value={item.quantity}
                  onDecrease={() => void updateCartQuantity(item.listingId, item.quantity - 1)}
                  onIncrease={() => void updateCartQuantity(item.listingId, item.quantity + 1)}
                />
              </View>
            );
          })}
        </View>
    </>
  );

  const deliveryAndPromoCard = (
    <>
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
    </>
  );

  const summaryContent = (
    <>
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
    </>
  );

  const orderButtonStyle = [
    styles.orderButton,
    { backgroundColor: theme.colors.accent, opacity: !selectedAddressId ? theme.motion.disabledOpacity : 1 },
    theme.shadows.accent,
  ];
  const orderButtonTextStyle = [styles.orderButtonText, { color: theme.colors.onAccent, fontFamily: theme.typography.label.fontFamily }];
  const orderButtonLabel = t('cart.orderCta', { total: formatMoney(cart.total) });

  const staticOrderButtonEl = (
    <Pressable disabled={isPlacingOrder || !selectedAddressId} onPress={() => void handlePlaceOrder()} style={orderButtonStyle}>
      {isPlacingOrder ? <ActivityIndicator color={theme.colors.onAccent} /> : <Text style={orderButtonTextStyle}>{orderButtonLabel}</Text>}
    </Pressable>
  );

  // Real card payment: native uses the Stripe PaymentSheet, web uses Stripe.js
  // (different SDKs, same Cloud Function). Both live in pay-order-button.tsx /
  // pay-order-button.web.tsx and are lazy-loaded so the native-only SDK never
  // reaches the web bundle (see stripe-app-provider.web.tsx for why).
  const orderButtonEl = (
    <ErrorBoundary fallback={staticOrderButtonEl}>
      <Suspense fallback={staticOrderButtonEl}>
        <PayOrderButton
          disabled={!selectedAddressId}
          label={orderButtonLabel}
          buttonStyle={orderButtonStyle}
          textStyle={orderButtonTextStyle}
          activityColor={theme.colors.onAccent}
          onPlaceOrder={handlePlaceOrderForPayment}
          onPaid={(orderId) => router.replace(`/checkout/success?orderId=${orderId}`)}
          onError={(message) => setOrderError(message)}
        />
      </Suspense>
    </ErrorBoundary>
  );

  const headerEl = (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.back()}
        style={[styles.roundButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <SymbolView tintColor={theme.colors.text} size={20} name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} />
      </Pressable>
      <View style={styles.headerCopy}>
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontFamily: theme.typography.title.fontFamily }]}>{t('cart.title')}</Text>
        {seller ? (
          <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
            {seller.brandName}
            {firstListingDeliveryMode ? ` · ${getDeliveryModeLabel(firstListingDeliveryMode)}` : ''}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (isWideLayout) {
    return (
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }}>
          <View style={styles.wideHeaderWrap}>{headerEl}</View>
        </SafeAreaView>
        <View style={styles.wideColumns}>
          <ScrollView contentContainerStyle={styles.wideLeftColumn} showsVerticalScrollIndicator={false}>
            {itemsCard}
            {deliveryAndPromoCard}
          </ScrollView>
          <View style={[styles.wideSummaryPanel, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
            {summaryContent}
            {orderError ? <Text style={[styles.errorText, { color: theme.colors.error, marginBottom: 8 }]}>{orderError}</Text> : null}
            {orderButtonEl}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }}>
        {headerEl}
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {itemsCard}
        {deliveryAndPromoCard}
        {summaryContent}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border, paddingBottom: 14 + insets.bottom },
        ]}>
        {orderError ? <Text style={[styles.errorText, { color: theme.colors.error, marginBottom: 8 }]}>{orderError}</Text> : null}
        {orderButtonEl}
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

  wideHeaderWrap: { maxWidth: 1280, width: '100%', alignSelf: 'center', paddingHorizontal: 12 },
  wideColumns: { flex: 1, flexDirection: 'row', maxWidth: 1280, width: '100%', alignSelf: 'center', gap: 32, paddingHorizontal: 20 },
  wideLeftColumn: { flex: 1, minWidth: 0, gap: 16, paddingBottom: 48 },
  wideSummaryPanel: { width: 380, borderWidth: 1, padding: 20, gap: 16, marginTop: 12 },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 32, gap: 16 },
  card: { borderWidth: 1, padding: 14, gap: 4 },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  itemThumb: { width: 52, height: 52, borderRadius: 12, overflow: 'hidden' },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 15, lineHeight: 20 },
  itemPrice: { fontSize: 15, lineHeight: 20 },

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
