import { useStripe } from '@stripe/stripe-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { getFriendlyPaymentError } from '@/lib/errors/friendly-message';
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

// Native-only: owns the useStripe() hook and the full place-order -> create
// PaymentIntent -> present PaymentSheet flow. Kept in its own file and loaded
// via React.lazy() from cart.tsx so the @stripe/stripe-react-native native
// module (which ships no web build) is never imported into the web bundle.
export default function PayOrderButton({ disabled, label, buttonStyle, textStyle, activityColor, onPlaceOrder, onPaid, onError }: Props) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isProcessing, setIsProcessing] = useState(false);

  async function handlePress() {
    setIsProcessing(true);
    try {
      const order = await onPlaceOrder();
      if (!order) {
        return;
      }

      const { clientSecret } = await PaymentRepository.createPaymentIntent(order.id);

      const initResult = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'AoSell',
      });
      if (initResult.error) {
        onError(getFriendlyPaymentError(initResult.error));
        return;
      }

      const presentResult = await presentPaymentSheet();
      if (presentResult.error) {
        if (presentResult.error.code !== 'Canceled') {
          onError(getFriendlyPaymentError(presentResult.error));
        }
        return;
      }

      onPaid(order.id);
    } catch (error) {
      onError(getFriendlyPaymentError(error));
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Pressable disabled={disabled || isProcessing} onPress={() => void handlePress()} style={buttonStyle}>
      {isProcessing ? <ActivityIndicator color={activityColor} /> : <Text style={textStyle}>{label}</Text>}
    </Pressable>
  );
}
