import * as Linking from 'expo-linking';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/ui/app-screen';
import { SectionTitle } from '@/components/ui/section-title';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';

const SUPPORT_EMAIL = 'amadourys15@gmail.com';

export default function SupportScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const questions = [
    { q: t('landing.faq.q1'), a: t('landing.faq.a1') },
    { q: t('landing.faq.q2'), a: t('landing.faq.a2') },
    { q: t('landing.faq.q3'), a: t('landing.faq.a3') },
    { q: t('landing.faq.q4'), a: t('landing.faq.a4') },
  ];

  return (
    <AppScreen>
      <SectionTitle eyebrow={t('support.eyebrow')} title={t('support.title')} description={t('support.subtitle')} />

      <Pressable
        onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        style={[styles.emailCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
        <View style={[styles.emailIcon, { backgroundColor: theme.colors.accentTint, borderRadius: theme.radii.md }]}>
          <SymbolView tintColor={theme.colors.text} size={20} name={{ ios: 'envelope', android: 'mail', web: 'mail' }} />
        </View>
        <View style={styles.emailCopy}>
          <Text style={[styles.emailLabel, { color: theme.colors.textMuted }]}>{t('support.emailLabel')}</Text>
          <Text style={[styles.emailValue, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>{SUPPORT_EMAIL}</Text>
        </View>
      </Pressable>

      <Text style={[styles.faqTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
        {t('landing.faq.title')}
      </Text>
      <View style={styles.faqList}>
        {questions.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <Pressable
              key={item.q}
              onPress={() => setOpenIndex(isOpen ? null : index)}
              style={[styles.faqItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
              <View style={styles.faqHeaderRow}>
                <Text style={[styles.faqQuestion, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>{item.q}</Text>
                <SymbolView
                  tintColor={theme.colors.textMuted}
                  size={16}
                  name={{ ios: isOpen ? 'chevron.up' : 'chevron.down', android: isOpen ? 'expand_less' : 'expand_more', web: isOpen ? 'expand_less' : 'expand_more' }}
                />
              </View>
              {isOpen ? <Text style={[styles.faqAnswer, { color: theme.colors.textMuted }]}>{item.a}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  emailCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, padding: 16 },
  emailIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  emailCopy: { gap: 2 },
  emailLabel: { fontSize: 12, lineHeight: 16 },
  emailValue: { fontSize: 15, lineHeight: 20 },

  faqTitle: { fontSize: 18, lineHeight: 24, marginTop: 8 },
  faqList: { gap: 10 },
  faqItem: { borderWidth: 1, padding: 16 },
  faqHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  faqQuestion: { fontSize: 15, lineHeight: 21, flex: 1 },
  faqAnswer: { fontSize: 13, lineHeight: 20, marginTop: 10 },
});
