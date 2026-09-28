import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppScreen } from '@/components/ui/app-screen';
import { SectionTitle } from '@/components/ui/section-title';
import { DEFAULT_CITY } from '@/constants/location';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { PartnerLeadRepository } from '@/repositories/partner-lead-repository';
import type { PartnerLeadBusinessType } from '@/types/domain';

type AppTheme = ReturnType<typeof useAppTheme>;

const BUSINESS_TYPES: PartnerLeadBusinessType[] = ['restaurant', 'grocery', 'caterer'];

export default function PartnerScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<PartnerLeadBusinessType>('restaurant');
  const [neighborhood, setNeighborhood] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const businessTypeLabel: Record<PartnerLeadBusinessType, string> = {
    restaurant: t('partner.businessTypeRestaurant'),
    grocery: t('partner.businessTypeGrocery'),
    caterer: t('partner.businessTypeCaterer'),
  };

  async function handleSubmit() {
    if (!businessName.trim() || !phoneNumber.trim() || !email.trim()) {
      setError(t('partner.errorGeneric'));
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await PartnerLeadRepository.create({
        businessName: businessName.trim(),
        businessType,
        neighborhood: neighborhood.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim(),
        city: DEFAULT_CITY,
      });
      setIsSubmitted(true);
    } catch {
      setError(t('partner.errorGeneric'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <AppScreen>
        <View style={[styles.successCard, { backgroundColor: theme.colors.successTint, borderRadius: theme.radii.xl }]}>
          <SymbolView tintColor={theme.colors.success} size={36} name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }} />
          <Text style={[styles.successTitle, { color: theme.colors.text, fontFamily: theme.typography.title.fontFamily }]}>
            {t('partner.successTitle')}
          </Text>
          <Text style={[styles.successBody, { color: theme.colors.textMuted }]}>{t('partner.successBody')}</Text>
        </View>

        <View style={[styles.stepsCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
          <Text style={[styles.stepsTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
            {t('partner.stepsTitle')}
          </Text>
          <StepRow index={1} label={t('partner.step1')} theme={theme} />
          <StepRow index={2} label={t('partner.step2')} theme={theme} />
          <StepRow index={3} label={t('partner.step3')} theme={theme} />
        </View>

        <AppButton fullWidth label={t('partner.backHome')} onPress={() => router.replace('/home')} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <SectionTitle eyebrow={t('partner.eyebrow')} title={t('partner.title')} description={t('partner.subtitle')} />

      <View style={[styles.formCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
        <AppInput label={t('partner.businessName')} value={businessName} onChangeText={setBusinessName} />

        <View style={styles.typeRow}>
          {BUSINESS_TYPES.map((type) => (
            <Pressable
              key={type}
              onPress={() => setBusinessType(type)}
              style={[
                styles.typeChip,
                {
                  borderRadius: theme.radii.pill,
                  backgroundColor: businessType === type ? theme.colors.text : theme.colors.surfaceMuted,
                  borderColor: businessType === type ? theme.colors.text : theme.colors.border,
                },
              ]}>
              <Text
                style={[
                  styles.typeChipText,
                  { color: businessType === type ? '#FFFFFF' : theme.colors.text, fontFamily: theme.typography.label.fontFamily },
                ]}>
                {businessTypeLabel[type]}
              </Text>
            </Pressable>
          ))}
        </View>

        <AppInput label={t('partner.neighborhood')} value={neighborhood} onChangeText={setNeighborhood} />
        <AppInput label={t('partner.phone')} value={phoneNumber} onChangeText={setPhoneNumber} inputMode="tel" keyboardType="phone-pad" />
        <AppInput label={t('partner.email')} value={email} onChangeText={setEmail} inputMode="email" keyboardType="email-address" autoCapitalize="none" />

        {error ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text> : null}

        <AppButton
          fullWidth
          loading={isSubmitting}
          label={t('partner.submit')}
          onPress={() => {
            void handleSubmit();
          }}
        />
      </View>
    </AppScreen>
  );
}

function StepRow({ index, label, theme }: { index: number; label: string; theme: AppTheme }) {
  return (
    <View style={styles.stepRow}>
      <View style={[styles.stepBadge, { backgroundColor: theme.colors.accentTint, borderRadius: theme.radii.pill }]}>
        <Text style={[styles.stepBadgeText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>{index}</Text>
      </View>
      <Text style={[styles.stepLabel, { color: theme.colors.text, fontFamily: theme.typography.body.fontFamily }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  formCard: { borderWidth: 1, padding: 20, gap: 16 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9 },
  typeChipText: { fontSize: 13, lineHeight: 18 },
  errorText: { fontSize: 13, lineHeight: 18 },

  successCard: { alignItems: 'center', padding: 28, gap: 8 },
  successTitle: { fontSize: 22, lineHeight: 28, marginTop: 4 },
  successBody: { fontSize: 15, lineHeight: 22, textAlign: 'center' },

  stepsCard: { borderWidth: 1, padding: 20, gap: 16 },
  stepsTitle: { fontSize: 17, lineHeight: 22 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBadge: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  stepBadgeText: { fontSize: 13, lineHeight: 18 },
  stepLabel: { flex: 1, fontSize: 15, lineHeight: 21 },
});
