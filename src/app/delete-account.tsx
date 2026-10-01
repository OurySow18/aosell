import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { SectionTitle } from '@/components/ui/section-title';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { useAosell } from '@/providers/aosell-provider';

export default function DeleteAccountScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const { authReady, currentUser, deleteAccount } = useAosell();
  const [confirming, setConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setError('');
    setIsDeleting(true);
    try {
      await deleteAccount();
      setIsDone(true);
    } catch {
      setError(t('deleteAccount.error'));
      setIsDeleting(false);
    }
  }

  if (isDone) {
    return (
      <AppScreen>
        <View style={[styles.doneCard, { backgroundColor: theme.colors.successTint, borderRadius: theme.radii.xl }]}>
          <SymbolView tintColor={theme.colors.success} size={36} name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }} />
          <Text style={[styles.doneTitle, { color: theme.colors.text, fontFamily: theme.typography.title.fontFamily }]}>
            {t('deleteAccount.doneTitle')}
          </Text>
          <Text style={[styles.doneBody, { color: theme.colors.textMuted }]}>{t('deleteAccount.doneBody')}</Text>
        </View>
        <AppButton fullWidth label={t('common.backHome')} onPress={() => router.replace('/')} />
      </AppScreen>
    );
  }

  if (!authReady) {
    return <AppScreen>{null}</AppScreen>;
  }

  if (!currentUser) {
    return (
      <AppScreen>
        <SectionTitle
          eyebrow={t('deleteAccount.eyebrow')}
          title={t('deleteAccount.title')}
          description={t('deleteAccount.signInFirst')}
        />
        <AppButton
          fullWidth
          label={t('common.signIn')}
          onPress={() => router.push({ pathname: '/auth', params: { mode: 'signin', returnTo: '/delete-account' } })}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <SectionTitle eyebrow={t('deleteAccount.eyebrow')} title={t('deleteAccount.title')} description={currentUser.email} />

      <View style={[styles.warningCard, { backgroundColor: theme.colors.errorTint, borderRadius: theme.radii.lg }]}>
        <Text style={[styles.warningTitle, { color: theme.colors.error, fontFamily: theme.typography.label.fontFamily }]}>
          {t('deleteAccount.warningTitle')}
        </Text>
        <Bullet text={t('deleteAccount.item1')} theme={theme} />
        <Bullet text={t('deleteAccount.item2')} theme={theme} />
        <Bullet text={t('deleteAccount.item3')} theme={theme} />
        <Text style={[styles.warningNote, { color: theme.colors.text }]}>{t('deleteAccount.note')}</Text>
      </View>

      {error ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text> : null}

      {confirming ? (
        <View style={styles.confirmRow}>
          <AppButton label={t('common.cancel')} variant="secondary" onPress={() => setConfirming(false)} />
          <View style={styles.confirmButtonWrap}>
            <AppButton
              fullWidth
              variant="danger"
              loading={isDeleting}
              loadingLabel={t('deleteAccount.deleting')}
              label={t('deleteAccount.confirmButton')}
              onPress={() => void handleDelete()}
            />
          </View>
        </View>
      ) : (
        <AppButton fullWidth variant="danger" label={t('deleteAccount.deleteButton')} onPress={() => setConfirming(true)} />
      )}
    </AppScreen>
  );
}

function Bullet({ text, theme }: { text: string; theme: ReturnType<typeof useAppTheme> }) {
  return (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletDot, { backgroundColor: theme.colors.error }]} />
      <Text style={[styles.bulletText, { color: theme.colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  warningCard: { padding: 20, gap: 10 },
  warningTitle: { fontSize: 15, lineHeight: 20 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  bulletText: { fontSize: 14, lineHeight: 20, flex: 1 },
  warningNote: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  errorText: { fontSize: 13, lineHeight: 18 },
  confirmRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  confirmButtonWrap: { flex: 1 },

  doneCard: { alignItems: 'center', padding: 28, gap: 8 },
  doneTitle: { fontSize: 22, lineHeight: 28, marginTop: 4 },
  doneBody: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
