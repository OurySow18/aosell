import { StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { StatusPill } from '@/components/ui/status-pill';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/lib/utils/format';
import { useAosell } from '@/providers/aosell-provider';
import { ThemedText } from '@/components/themed-text';

export default function NotificationsScreen() {
  const theme = useTheme();
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
            style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={[styles.cardGlow, { backgroundColor: theme.gold }]} />
            <View style={styles.header}>
              <ThemedText type="headline">{notification.title}</ThemedText>
              <StatusPill label={notification.isRead ? t('common.read') : t('common.new')} tone={notification.isRead ? 'neutral' : 'brand'} />
            </View>
            <ThemedText type="body" themeColor="textSecondary">
              {notification.body}
            </ThemedText>
            <View style={styles.footer}>
              <ThemedText type="bodySmall" themeColor="textSecondary">
                {formatDate(notification.createdAt)}
              </ThemedText>
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
  list: {
    gap: Spacing.md,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.lg,
    gap: Spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  cardGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -70,
    right: -60,
    opacity: 0.35,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
});
