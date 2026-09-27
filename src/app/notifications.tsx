import { StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { StatusPill } from '@/components/ui/status-pill';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { formatDate } from '@/lib/utils/format';
import { useAosell } from '@/providers/aosell-provider';

export default function NotificationsScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const { notifications, markNotificationRead } = useAosell();
  const [pendingNotificationId, setPendingNotificationId] = useState<string | null>(null);

  if (!notifications.length) {
    return (
      <AppScreen>
        <EmptyState title={t('notificationsScreen.emptyTitle')} description={t('notificationsScreen.emptyDescription')} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <SectionTitle
        eyebrow={t('notificationsScreen.eyebrow')}
        title={t('notificationsScreen.title')}
        description={t('notificationsScreen.description')}
      />
      <View style={styles.list}>
        {notifications.map((notification) => (
          <View
            key={notification.id}
            style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
            <View style={styles.header}>
              <Text style={[styles.heading, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
                {notification.title}
              </Text>
              <StatusPill label={notification.isRead ? t('common.read') : t('common.new')} tone={notification.isRead ? 'neutral' : 'brand'} />
            </View>
            <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.typography.body.fontFamily }]}>
              {notification.body}
            </Text>
            <View style={styles.footer}>
              <Text style={[styles.bodySmall, { color: theme.colors.textMuted }]}>{formatDate(notification.createdAt)}</Text>
              {!notification.isRead ? (
                <AppButton
                  disabled={pendingNotificationId !== null}
                  label={t('notificationsScreen.markRead')}
                  variant="ghost"
                  onPress={() => {
                    setPendingNotificationId(notification.id);
                    void markNotificationRead(notification.id).finally(() => setPendingNotificationId(null));
                  }}
                />
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  card: { borderWidth: 1, padding: 16, gap: 12 },
  heading: { fontSize: 17, lineHeight: 22 },
  body: { fontSize: 15, lineHeight: 21 },
  bodySmall: { fontSize: 13, lineHeight: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
});
