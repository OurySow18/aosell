import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { SectionTitle } from '@/components/ui/section-title';
import { Spacing } from '@/constants/theme';

export default function CheckoutSuccessScreen() {
  const params = useLocalSearchParams<{ orderId?: string | string[] }>();
  const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId ?? '';

  return (
    <AppScreen>
      <View style={styles.container}>
        <SectionTitle
          eyebrow="Order created"
          title="Payment flow started"
          description={`Order ${orderId} is now stored in Firestore with status pending payment. The Stripe webhook can move it to paid once the payment intent succeeds.`}
        />
        <AppButton label="Open order" onPress={() => router.replace(`/orders/${orderId}`)} />
        <AppButton label="Back home" variant="ghost" onPress={() => router.replace('/home')} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: '100%',
    justifyContent: 'center',
    gap: Spacing.lg,
    maxWidth: 480,
    alignSelf: 'center',
  },
});
