import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/ui/app-screen';
import { SectionTitle } from '@/components/ui/section-title';
import { useAppTheme } from '@/hooks/use-theme';

const LAST_UPDATED = 'November 4, 2026';
const CONTACT_EMAIL = 'amadourys15@gmail.com';
const OPERATOR = 'Amadou Oury Sow';

const SECTIONS: { heading: string; body: string[] }[] = [
  {
    heading: '1. Acceptance of these terms',
    body: [
      `These terms govern your use of AoSell, a local delivery marketplace operated by ${OPERATOR}, connecting independent restaurants, shops, and individual cooks ("sellers") in Bremen, Germany with local customers ("buyers"). By creating an account or using the app, you agree to these terms. If you do not agree, do not use AoSell.`,
      `Contact: ${CONTACT_EMAIL}`,
    ],
  },
  {
    heading: '2. Who can use AoSell',
    body: [
      'You must be at least 16 years old and able to form a binding contract to create an account. You are responsible for the accuracy of the information you provide and for keeping your login credentials secure.',
      'Any signed-in user may act as both a buyer and a seller — for example, by publishing a home-cooked dish or product for sale. Publishing your first item automatically opens a lightweight seller profile; no separate application is required for individuals. Restaurants and shops may additionally complete a full seller onboarding for a verified storefront.',
    ],
  },
  {
    heading: '3. AoSell is a marketplace, not the seller',
    body: [
      'AoSell provides the platform that connects buyers and sellers, and facilitates ordering, payment, and (where applicable) delivery logistics. Each listing — a dish, product, or service — is created, priced, and fulfilled by the independent seller who posted it, not by AoSell.',
      'Sellers, not AoSell, are responsible for the accuracy of their listings, the quality, safety, and hygienic preparation of any food or product sold, compliance with applicable food-safety and business regulations, and fulfilling orders as described.',
      'AoSell does not inspect, certify, or guarantee any seller’s food-safety practices, licenses, or the quality of what they sell. If you have a food allergy or dietary restriction, confirm ingredients directly with the seller before ordering.',
    ],
  },
  {
    heading: '4. Orders and payments',
    body: [
      'When you place an order, you enter into a direct transaction with the seller; AoSell facilitates that transaction. Prices, delivery fees, and estimated timing are shown before you confirm an order.',
      'Payments are processed securely by Stripe, Inc. AoSell does not store your full card details.',
      'Cancellations and refunds are handled case by case between you and the seller, or through AoSell support if the seller is unresponsive. Once a seller has started preparing an order, cancellation may no longer be possible.',
      'Your statutory consumer rights under German and EU law (including, where applicable, the right of withdrawal) are not affected by these terms, except to the extent such rights do not apply to made-to-order perishable goods like freshly prepared food.',
    ],
  },
  {
    heading: '5. Content you post',
    body: [
      'AoSell lets you publish posts — photos, videos, captions, and comments — and link them to your shop or a listing, or simply share without selling anything. You keep ownership of what you post.',
      'By posting content, you grant AoSell a non-exclusive, worldwide, royalty-free license to host, display, and distribute it within the app and its promotional materials, for as long as the content remains posted (or as required to operate the service).',
      'You are solely responsible for what you post. Do not post content that is illegal, infringes someone else’s rights, is misleading about a product’s safety or ingredients, or violates these terms. AoSell may remove content or suspend accounts that violate this section.',
    ],
  },
  {
    heading: '6. Delivery',
    body: [
      'Depending on the seller, delivery is carried out by AoSell’s own delivery option, by the seller directly, or by pickup. Delivery times shown in the app are estimates, not guarantees. AoSell is not liable for delays caused by the seller, a courier, weather, or circumstances outside its reasonable control.',
    ],
  },
  {
    heading: '7. Account suspension and termination',
    body: [
      'You may delete your account at any time from the app. AoSell may suspend or terminate accounts that violate these terms, repeatedly cause unresolved disputes, or engage in fraudulent or unsafe activity.',
    ],
  },
  {
    heading: '8. Limitation of liability',
    body: [
      `To the maximum extent permitted by law, ${OPERATOR} and AoSell are not liable for indirect, incidental, or consequential damages arising from your use of the app, or from a transaction between a buyer and a seller. Nothing in these terms limits liability for intent, gross negligence, or harm to life, body, or health, where such a limitation would not be permitted under German law.`,
    ],
  },
  {
    heading: '9. Governing law',
    body: [
      'These terms are governed by German law. If you are a consumer habitually resident in another EU country, you also benefit from any mandatory consumer-protection provisions of that country’s law.',
    ],
  },
  {
    heading: '10. Changes to these terms',
    body: [
      'We may update these terms from time to time. We will update the "last updated" date below when we do. Continued use of AoSell after a change means you accept the updated terms.',
    ],
  },
];

export default function TermsScreen() {
  const theme = useAppTheme();

  return (
    <AppScreen>
      <SectionTitle eyebrow="Terms" title="Terms of service" description={`Last updated: ${LAST_UPDATED}`} />

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
