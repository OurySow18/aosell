import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/ui/app-screen';
import { SectionTitle } from '@/components/ui/section-title';
import { useAppTheme } from '@/hooks/use-theme';

const LAST_UPDATED = 'September 30, 2026';
const CONTACT_EMAIL = 'amadourys15@gmail.com';
const OPERATOR = 'Amadou Oury Sow';

const SECTIONS: { heading: string; body: string[] }[] = [
  {
    heading: '1. Who we are',
    body: [
      `AoSell ("we", "us", "our") is a local delivery marketplace operated by ${OPERATOR}, connecting independent restaurants and shops in Bremen, Germany with local customers. This policy explains what personal data AoSell collects through its mobile app and website, why, and what rights you have over it.`,
      `Contact: ${CONTACT_EMAIL}`,
    ],
  },
  {
    heading: '2. What data we collect',
    body: [
      'Account data: name, email address, and password (stored in hashed form by our authentication provider). If you sign in with Apple or Google, we receive your name and email from that provider instead of a password.',
      'Delivery data: delivery address, postal code, city, and phone number, used to fulfill your orders.',
      'Order data: items ordered, order status, and order history.',
      'Payment data: payments are processed by Stripe, Inc. We never see or store your full card number — Stripe shares with us only a payment confirmation and the last digits of your card for your own order history.',
      'Content you choose to share: if you use the social feed, we store the photos, videos, comments, likes, and follows you post or interact with. Sellers additionally provide a business name, description, and product listings.',
      'Technical data: basic app diagnostics (e.g. crash reports) needed to keep the service running reliably.',
    ],
  },
  {
    heading: '3. How we use your data',
    body: [
      'To create and manage your account, and let you sign in.',
      'To process and deliver your orders, including sharing your delivery address and phone number with the seller fulfilling your order, and with the courier when applicable.',
      'To process payments securely through Stripe.',
      'To operate the social feed and seller tools you choose to use.',
      'To communicate with you about your orders or account.',
      'To maintain the security and reliability of the service.',
    ],
  },
  {
    heading: '4. Who we share data with',
    body: [
      'Sellers and couriers, limited to what is needed to fulfill an order (name, delivery address, phone number, order contents).',
      'Google Firebase (Google Ireland Ltd.), which hosts our database, file storage, authentication, and backend functions.',
      'Stripe, Inc., which processes payments on our behalf.',
      'Apple and Google, only if you choose to sign in with Apple or Google — they authenticate your identity to us; we do not share your AoSell data back with them beyond what their sign-in SDK requires to function.',
      'We do not sell your personal data to third parties, and we do not share it for third-party advertising.',
    ],
  },
  {
    heading: '5. Data retention',
    body: [
      'We keep account and order data for as long as your account is active, and afterward only as needed to meet legal obligations (e.g. tax and accounting records) or to resolve disputes. You can request deletion of your account at any time (see Section 6).',
    ],
  },
  {
    heading: '6. Your rights',
    body: [
      'If you are located in the European Economic Area, you have the right, under the GDPR, to access, correct, export, or delete your personal data, and to object to or restrict certain processing. To exercise any of these rights, contact us at the email address above. We will respond within the timeframes required by applicable law.',
      'You may also lodge a complaint with your local data protection authority.',
    ],
  },
  {
    heading: '7. Children',
    body: [
      'AoSell is not directed at children, and we do not knowingly collect personal data from children under 16.',
    ],
  },
  {
    heading: '8. Changes to this policy',
    body: [
      'We may update this policy from time to time. We will update the "last updated" date below when we do. Continued use of AoSell after a change means you accept the updated policy.',
    ],
  },
];

export default function PrivacyScreen() {
  const theme = useAppTheme();

  return (
    <AppScreen>
      <SectionTitle eyebrow="Privacy" title="Privacy policy" description={`Last updated: ${LAST_UPDATED}`} />

      {SECTIONS.map((section) => (
        <View key={section.heading} style={styles.section}>
          <Text style={[styles.heading, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
            {section.heading}
          </Text>
          {section.body.map((paragraph, index) => (
            <Text key={index} style={[styles.paragraph, { color: theme.colors.textMuted }]}>
              {paragraph}
            </Text>
          ))}
        </View>
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  heading: { fontSize: 17, lineHeight: 23 },
  paragraph: { fontSize: 14, lineHeight: 21 },
});
