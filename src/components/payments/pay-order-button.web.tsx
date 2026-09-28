import { Pressable, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

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

// Web build of pay-order-button.tsx — see stripe-app-provider.web.tsx for why
// this platform-specific file exists. cart.tsx never renders this on web
// (Platform.OS check), so it's inert; kept only so the web bundle resolves.
export default function PayOrderButton({ disabled, label, buttonStyle, textStyle }: Props) {
  return (
    <Pressable disabled={disabled} style={buttonStyle}>
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
}
