import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { Radius, Spacing } from '@/constants/theme';
import { addressSchema } from '@/lib/validations/address';
import { checkoutSchema } from '@/lib/validations/checkout';
import { formatMoney } from '@/lib/utils/format';
import { useTheme } from '@/hooks/use-theme';
import { useAosell } from '@/providers/aosell-provider';
import { ThemedText } from '@/components/themed-text';

export default function CheckoutScreen() {
  const theme = useTheme();
  const { cart, addresses, addAddress, placeOrder } = useAosell();
  const [selectedAddressId, setSelectedAddressId] = useState(addresses[0]?.id ?? '');
  const [draftAddress, setDraftAddress] = useState({
    fullName: '',
    phoneNumber: '',
    line1: '',
    postalCode: '',
    city: '',
    countryCode: 'DE',
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
        <EmptyState title="No active cart" description="Add items to cart before opening checkout." />
      </AppScreen>
    );
  }

  async function handleAddAddress() {
    const parsed = addressSchema.safeParse(draftAddress);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Address is invalid.');
      return;
    }
    setIsSavingAddress(true);
    const address = await addAddress({
      ...parsed.data,
      isDefault: false,
    });
    setIsSavingAddress(false);
    if (!address) {
      setError('You need to sign in before saving an address.');
      return;
    }
    setSelectedAddressId(address.id);
    setDraftAddress({
      fullName: '',
      phoneNumber: '',
      line1: '',
      postalCode: '',
      city: '',
      countryCode: 'DE',
      instructions: '',
    });
    setError('');
  }

  async function handlePay() {
    const validation = checkoutSchema.safeParse({ addressId: selectedAddressId, sellerId: cart.sellerId });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? 'Checkout payload is invalid.');
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
        eyebrow="Checkout"
        title="Address, summary, payment"
        description="The Stripe function hook is scaffolded. This screen now creates the Firestore order in the pending payment state before the payment confirmation path takes over."
      />

      <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <ThemedText type="headline">Select address</ThemedText>
        {addresses.map((address) => (
          <AppButton
            key={address.id}
            label={`${address.fullName} · ${address.city}`}
            onPress={() => setSelectedAddressId(address.id)}
            variant={selectedAddressId === address.id ? 'secondary' : 'ghost'}
          />
        ))}
      </View>

      <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <ThemedText type="headline">Add new address</ThemedText>
        <AppInput label="Full name" value={draftAddress.fullName} onChangeText={(value) => setDraftAddress((current) => ({ ...current, fullName: value }))} />
        <AppInput label="Phone" value={draftAddress.phoneNumber} onChangeText={(value) => setDraftAddress((current) => ({ ...current, phoneNumber: value }))} />
        <AppInput label="Street" value={draftAddress.line1} onChangeText={(value) => setDraftAddress((current) => ({ ...current, line1: value }))} />
        <View style={styles.row}>
          <AppInput label="Postal code" value={draftAddress.postalCode} onChangeText={(value) => setDraftAddress((current) => ({ ...current, postalCode: value }))} />
          <AppInput label="City" value={draftAddress.city} onChangeText={(value) => setDraftAddress((current) => ({ ...current, city: value }))} />
        </View>
        <AppButton
          disabled={isSavingAddress}
          label="Save address"
          variant="ghost"
          onPress={() => {
            void handleAddAddress();
          }}
        />
      </View>

      <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <ThemedText type="headline">Order summary</ThemedText>
        <SummaryRow label="Subtotal" value={formatMoney(cart.subtotal)} />
        <SummaryRow label="Delivery" value={formatMoney(cart.deliveryFee)} />
        <SummaryRow label="Total" value={formatMoney(cart.total)} />
        {error ? (
          <ThemedText type="bodySmall" themeColor="error">
            {error}
          </ThemedText>
        ) : null}
        <AppButton
          disabled={isSubmittingOrder}
          label="Create payment order"
          onPress={() => {
            void handlePay();
          }}
        />
      </View>
    </AppScreen>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <ThemedText type="body" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="headline">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
