import { Redirect } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AdminScreen } from '@/components/admin-screen';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/lib/i18n';
import { useAdminAuth } from '@/providers/admin-auth';
import type { AppTheme } from '@/hooks/use-theme';

// Exemple statique — la file de modération du fil social n'existe pas encore
// côté serveur (pas de collection "reports", pas de champ de masquage sur
// les posts). Cet écran montre à quoi ressemblerait le flux une fois
// construit ; Garder/Masquer/Suspendre ne changent que l'état local ici.
// Le "text" de chaque post reste en français volontairement : il représente
// un vrai contenu utilisateur (jamais traduit dans un vrai produit), à la
// différence de role/kind/reason/when qui sont des labels d'interface.
type Decision = 'keep' | 'hide' | 'ban';
type Reason = 'harassment' | 'unauthorizedSale' | 'spam' | 'misleadingPhoto' | 'disputedReview';
type Kind = 'comment' | 'photo' | 'video';
type Role = 'client' | 'seller';

const POSTS: {
  id: number;
  author: string;
  initial: string;
  role: Role;
  whenKey: 'whenMinutesAgo' | 'whenHoursAgo' | 'whenYesterday';
  whenCount?: number;
  kind: Kind;
  text: string;
  reason: Reason;
  count: number;
  tint: string;
  blur: boolean;
}[] = [
  {
    id: 1,
    author: '@user_5531',
    initial: 'U',
    role: 'client',
    whenKey: 'whenMinutesAgo',
    whenCount: 40,
    kind: 'comment',
    text: 'Commentaire sous une vidéo de Teranga Küche, signalé pour insultes envers la cuisinière.',
    reason: 'harassment',
    count: 6,
    tint: '#E8EBF2',
    blur: true,
  },
  {
    id: 2,
    author: '@shoes.bremen',
    initial: 'S',
    role: 'client',
    whenKey: 'whenHoursAgo',
    whenCount: 2,
    kind: 'photo',
    text: 'Baskets à vendre, écrivez-moi en privé pour le prix.',
    reason: 'unauthorizedSale',
    count: 4,
    tint: '#DCEBFF',
    blur: false,
  },
  {
    id: 3,
    author: '@baobab_grill',
    initial: 'B',
    role: 'seller',
    whenKey: 'whenHoursAgo',
    whenCount: 3,
    kind: 'photo',
    text: 'Nouveau dibi ce week-end. Commandez directement sur notre WhatsApp pour -20 %.',
    reason: 'spam',
    count: 3,
    tint: '#FFF0C7',
    blur: false,
  },
  {
    id: 4,
    author: '@mafe.co',
    initial: 'M',
    role: 'seller',
    whenKey: 'whenYesterday',
    kind: 'photo',
    text: 'Mafé agneau, portion familiale. Photo signalée : portion livrée bien plus petite.',
    reason: 'misleadingPhoto',
    count: 2,
    tint: '#FFE1E1',
    blur: false,
  },
  {
    id: 5,
    author: '@lena.k',
    initial: 'L',
    role: 'client',
    whenKey: 'whenYesterday',
    kind: 'video',
    text: 'Commande arrivée froide après une heure. Je ne recommande pas.',
    reason: 'disputedReview',
    count: 1,
    tint: '#DDF3E6',
    blur: false,
  },
];

const REASON_TONE: Record<Reason, { bg: string; fg: string }> = {
  harassment: { bg: '#FFE1E1', fg: '#A3202A' },
  unauthorizedSale: { bg: '#FFF0C7', fg: '#7A4F00' },
  spam: { bg: '#FFF0C7', fg: '#7A4F00' },
  misleadingPhoto: { bg: '#DCEBFF', fg: '#1C4F96' },
  disputedReview: { bg: '#F3F4F7', fg: '#3A4766' },
};

const REASON_KEY: Record<Reason, string> = {
  harassment: 'moderation.reasonHarassment',
  unauthorizedSale: 'moderation.reasonUnauthorizedSale',
  spam: 'moderation.reasonSpam',
  misleadingPhoto: 'moderation.reasonMisleadingPhoto',
  disputedReview: 'moderation.reasonDisputedReview',
};

const KIND_KEY: Record<Kind, string> = {
  comment: 'moderation.kindComment',
  photo: 'moderation.kindPhoto',
  video: 'moderation.kindVideo',
};

const ROLE_KEY: Record<Role, string> = {
  client: 'moderation.roleClient',
  seller: 'moderation.roleSeller',
};

const DECISION_BG: Record<Decision, { bg: string; fg: string }> = {
  keep: { bg: '#DDF3E6', fg: '#1E6B44' },
  hide: { bg: '#FFF0C7', fg: '#7A4F00' },
  ban: { bg: '#FFE1E1', fg: '#A3202A' },
};

export default function ModerationScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const { status } = useAdminAuth();
  const [decisions, setDecisions] = useState<Record<number, Decision>>({});

  if (status !== 'admin') {
    return <Redirect href="/" />;
  }

  const left = POSTS.filter((p) => !decisions[p.id]).length;
  const decisionText: Record<Decision, string> = {
    keep: t('moderation.decisionKeep'),
    hide: t('moderation.decisionHide'),
    ban: t('moderation.decisionBan'),
  };

  return (
    <AdminScreen subtitle={t('moderation.subtitle', { count: left })} title={t('moderation.title')}>
      <View style={styles.grid}>
        {POSTS.map((post) => {
          const decision = decisions[post.id];
          const tone = REASON_TONE[post.reason];
          return (
            <View
              key={post.id}
              style={[
                styles.card,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl, opacity: decision ? 0.75 : 1 },
              ]}>
              <View style={[styles.media, { backgroundColor: post.tint, borderTopLeftRadius: theme.radii.xl, borderTopRightRadius: theme.radii.xl }]}>
                <View style={[styles.mediaLabel, { borderRadius: theme.radii.pill }]}>
                  <Text style={styles.mediaLabelText}>{t(KIND_KEY[post.kind])}</Text>
                </View>
                {post.blur && !decision ? <Text style={styles.blurText}>{t('moderation.hiddenNotice')}</Text> : null}
              </View>
              <View style={styles.cardBody}>
                <View style={styles.authorRow}>
                  <View style={[styles.avatar, { backgroundColor: theme.colors.surfaceMuted }]}>
                    <Text style={[styles.avatarText, { color: theme.colors.text }]}>{post.initial}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.author, { color: theme.colors.text }]}>{post.author}</Text>
                    <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
                      {t(ROLE_KEY[post.role])} · {t(`moderation.${post.whenKey}`, { count: post.whenCount ?? 0 })}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.text, { color: theme.colors.text }]}>{post.text}</Text>
                <View style={styles.reasonRow}>
                  <View style={[styles.reasonPill, { backgroundColor: tone.bg, borderRadius: theme.radii.pill }]}>
                    <Text style={[styles.reasonText, { color: tone.fg }]}>{t(REASON_KEY[post.reason])}</Text>
                  </View>
                  <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
                    {t(post.count > 1 ? 'moderation.reportCountOther' : 'moderation.reportCountOne', { count: post.count })}
                  </Text>
                </View>
                {decision ? (
                  <View style={[styles.doneBanner, { backgroundColor: DECISION_BG[decision].bg, borderRadius: theme.radii.md }]}>
                    <Text style={[styles.doneText, { color: DECISION_BG[decision].fg }]}>{decisionText[decision]}</Text>
                  </View>
                ) : (
                  <DecisionButtons onDecide={(d) => setDecisions((prev) => ({ ...prev, [post.id]: d }))} t={t} theme={theme} />
                )}
              </View>
            </View>
          );
        })}
      </View>
    </AdminScreen>
  );
}

function DecisionButtons({
  onDecide,
  theme,
  t,
}: {
  onDecide: (d: Decision) => void;
  theme: AppTheme;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  return (
    <View style={styles.actions}>
      <Text onPress={() => onDecide('keep')} style={[styles.actionBtn, styles.actionNeutral, { borderColor: theme.colors.border, borderRadius: theme.radii.md, color: theme.colors.text }]}>
        {t('moderation.keep')}
      </Text>
      <Text onPress={() => onDecide('hide')} style={[styles.actionBtn, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.md, color: theme.colors.onAccent }]}>
        {t('moderation.hide')}
      </Text>
      <Text onPress={() => onDecide('ban')} style={[styles.actionBtn, styles.actionDanger, { borderColor: theme.colors.errorTint, borderRadius: theme.radii.md, color: theme.colors.error }]}>
        {t('moderation.suspend')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { flexGrow: 1, flexBasis: 280, maxWidth: 340, borderWidth: 1, overflow: 'hidden' },
  media: { height: 120, padding: 12, justifyContent: 'space-between' },
  mediaLabel: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,.8)', paddingHorizontal: 10, paddingVertical: 4 },
  mediaLabelText: { fontSize: 12, fontWeight: '600', color: '#3A4766' },
  blurText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  cardBody: { padding: 16, gap: 12 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontWeight: '700' },
  author: { fontSize: 14, fontWeight: '600' },
  meta: { fontSize: 12 },
  text: { fontSize: 13, lineHeight: 19 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  reasonPill: { paddingHorizontal: 10, paddingVertical: 3 },
  reasonText: { fontSize: 12, fontWeight: '600' },
  doneBanner: { padding: 12 },
  doneText: { fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600', paddingVertical: 11, overflow: 'hidden' },
  actionNeutral: { borderWidth: 1, backgroundColor: 'transparent' },
  actionDanger: { borderWidth: 1, backgroundColor: 'transparent' },
});
