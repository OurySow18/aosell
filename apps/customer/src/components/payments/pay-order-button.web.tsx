import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { getFriendlyPaymentError } from '@/lib/errors/friendly-message';
import { stripeConfig } from '@/lib/stripe';
import { PaymentRepository } from '@/repositories/payment-repository';
import type { Order } from '@/types/domain';

type Props = {
  disabled: boolean;
  label: string;
  buttonStyle: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
  activityColor: string;
  onPlaceOrder: () => Promise<Order | null>;
  onPaid: (orderId: string) => void;
  onError: (message: string) => void;
};

// Web build of pay-order-button.tsx. @stripe/stripe-react-native (native) has
// no web build, so the web variant uses Stripe.js/React Stripe.js instead —
// a different SDK, same PaymentIntent created by the same Cloud Function.
let stripePromise: Promise<Stripe | null> | undefined;
function getStripePromise() {
  if (!stripePromise) {
    stripePromise = loadStripe(stripeConfig.publishableKey);
  }
  return stripePromise;
}

export default function PayOrderButton({ disabled, label, buttonStyle, textStyle, activityColor, onPlaceOrder, onPaid, onError }: Props) {
  const [isStarting, setIsStarting] = useState(false);
  const [session, setSession] = useState<{ orderId: string; clientSecret: string } | null>(null);

  async function handlePress() {
    setIsStarting(true);
    try {
      const order = await onPlaceOrder();
      if (!order) {
        return;
      }
      const { clientSecret } = await PaymentRepository.createPaymentIntent(order.id);
      setSession({ orderId: order.id, clientSecret });
    } catch (error) {
      onError(getFriendlyPaymentError(error));
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <>
      <Pressable disabled={disabled || isStarting} onPress={() => void handlePress()} style={buttonStyle}>
        {isStarting ? <ActivityIndicator color={activityColor} /> : <Text style={textStyle}>{label}</Text>}
      </Pressable>
      {session ? (
        <Elements stripe={getStripePromise()} options={{ clientSecret: session.clientSecret }}>
          <PaymentSheetModal
            onClose={() => setSession(null)}
            onPaid={() => {
              setSession(null);
              onPaid(session.orderId);
            }}
            onError={onError}
          />
        </Elements>
      ) : null}
    </>
  );
}

function PaymentSheetModal({ onClose, onPaid, onError }: { onClose: () => void; onPaid: () => void; onError: (message: string) => void }) {
  const theme = useAppTheme();
  const { t } = useLocale();
  const stripe = useStripe();
  const elements = useElements();
  const [isConfirming, setIsConfirming] = useState(false);

  async function handleConfirm() {
    if (!stripe || !elements) {
      return;
    }
    setIsConfirming(true);
    const { error, paymentIntent } = await stripe.confirmPayment({ elements, redirect: 'if_required' });
    setIsConfirming(false);

    if (error) {
      onError(getFriendlyPaymentError(error));
      return;
    }
    if (paymentIntent?.status === 'succeeded') {
      onPaid();
    }
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: theme.radii.xl }]}>
          <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
            {t('payment.title')}
          </Text>
          <PaymentElement />
          <View style={styles.actions}>
            <Pressable
              disabled={isConfirming}
              onPress={onClose}
              style={[styles.cancelButton, { borderColor: theme.colors.border, borderRadius: theme.radii.md }]}>
              <Text style={[styles.cancelText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
                {t('payment.cancel')}
              </Text>
            </Pressable>
            <Pressable
              disabled={isConfirming || !stripe}
              onPress={() => void handleConfirm()}
              style={[styles.confirmButton, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.md }]}>
              {isConfirming ? (
                <ActivityIndicator color={theme.colors.onAccent} />
              ) : (
                <Text style={[styles.confirmText, { color: theme.colors.onAccent, fontFamily: theme.typography.label.fontFamily }]}>
                  {t('payment.payButton')}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,33,61,0.55)', padding: 20 },
  card: { width: '100%', maxWidth: 440, padding: 24, gap: 16 },
  title: { fontSize: 17, lineHeight: 24 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelButton: { flex: 1, height: 48, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 15, lineHeight: 20 },
  confirmButton: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontSize: 15, lineHeight: 20 },
});
