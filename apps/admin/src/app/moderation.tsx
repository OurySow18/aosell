import { Redirect } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AdminScreen } from '@/components/admin-screen';
import { useAppTheme } from '@/hooks/use-theme';
import { useAdminAuth } from '@/providers/admin-auth';
import type { AppTheme } from '@/hooks/use-theme';

// Exemple statique — la file de modération du fil social n'existe pas encore
// côté serveur (pas de collection "reports", pas de champ de masquage sur
// les posts). Cet écran montre à quoi ressemblerait le flux une fois
// construit ; Garder/Masquer/Suspendre ne changent que l'état local ici.
type Decision = 'keep' | 'hide' | 'ban';

const POSTS = [
  {
    id: 1,
    author: '@user_5531',
    initial: 'U',
    role: 'Client',
    when: 'il y a 40 min',
    kind: 'Commentaire',
    text: "Commentaire sous une vidéo de Teranga Küche, signalé pour insultes envers la cuisinière.",
    reason: 'Harcèlement',
    count: 6,
    tint: '#E8EBF2',
    blur: true,
  },
  {
    id: 2,
    author: '@shoes.bremen',
    initial: 'S',
    role: 'Client',
    when: 'il y a 2 h',
    kind: 'Photo',
    text: 'Baskets à vendre, écrivez-moi en privé pour le prix.',
    reason: 'Vente non autorisée',
    count: 4,
    tint: '#DCEBFF',
    blur: false,
  },
  {
    id: 3,
    author: '@baobab_grill',
    initial: 'B',
    role: 'Vendeur',
    when: 'il y a 3 h',
    kind: 'Photo',
    text: 'Nouveau dibi ce week-end. Commandez directement sur notre WhatsApp pour -20 %.',
    reason: 'Spam / publicité',
    count: 3,
    tint: '#FFF0C7',
    blur: false,
  },
  {
    id: 4,
    author: '@mafe.co',
    initial: 'M',
    role: 'Vendeur',
    when: 'hier',
    kind: 'Photo',
    text: 'Mafé agneau, portion familiale. Photo signalée : portion livrée bien plus petite.',
    reason: 'Photo trompeuse',
    count: 2,
    tint: '#FFE1E1',
    blur: false,
  },
  {
    id: 5,
    author: '@lena.k',
    initial: 'L',
    role: 'Client',
    when: 'hier',
    kind: 'Vidéo',
    text: 'Commande arrivée froide après une heure. Je ne recommande pas.',
    reason: 'Avis contesté',
    count: 1,
    tint: '#DDF3E6',
    blur: false,
  },
];

const REASON_TONE: Record<string, { bg: string; fg: string }> = {
  'Harcèlement': { bg: '#FFE1E1', fg: '#A3202A' },
  'Vente non autorisée': { bg: '#FFF0C7', fg: '#7A4F00' },
  'Spam / publicité': { bg: '#FFF0C7', fg: '#7A4F00' },
  'Photo trompeuse': { bg: '#DCEBFF', fg: '#1C4F96' },
  'Avis contesté': { bg: '#F3F4F7', fg: '#3A4766' },
};

const DECISION_TEXT: Record<Decision, { text: string; bg: string; fg: string }> = {
  keep: { text: 'Gardé : le signalement est clos.', bg: '#DDF3E6', fg: '#1E6B44' },
  hide: { text: 'Masqué : l’auteur est prévenu.', bg: '#FFF0C7', fg: '#7A4F00' },
  ban: { text: 'Compte suspendu 7 jours.', bg: '#FFE1E1', fg: '#A3202A' },
};

export default function ModerationScreen() {
  const theme = useAppTheme();
  const { status } = useAdminAuth();
  const [decisions, setDecisions] = useState<Record<number, Decision>>({});

  if (status !== 'admin') {
    return <Redirect href="/" />;
  }

  const left = POSTS.filter((p) => !decisions[p.id]).length;

  return (
    <AdminScreen subtitle={`${left} signalements à traiter · données d'exemple`} title="Modération du fil">
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
                  <Text style={styles.mediaLabelText}>{post.kind}</Text>
                </View>
                {post.blur && !decision ? <Text style={styles.blurText}>Contenu masqué en attente de décision</Text> : null}
              </View>
              <View style={styles.cardBody}>
                <View style={styles.authorRow}>
                  <View style={[styles.avatar, { backgroundColor: theme.colors.surfaceMuted }]}>
                    <Text style={[styles.avatarText, { color: theme.colors.text }]}>{post.initial}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.author, { color: theme.colors.text }]}>{post.author}</Text>
                    <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
                      {post.role} · {post.when}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.text, { color: theme.colors.text }]}>{post.text}</Text>
                <View style={styles.reasonRow}>
                  <View style={[styles.reasonPill, { backgroundColor: tone.bg, borderRadius: theme.radii.pill }]}>
                    <Text style={[styles.reasonText, { color: tone.fg }]}>{post.reason}</Text>
                  </View>
                  <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
                    {post.count} signalement{post.count > 1 ? 's' : ''}
                  </Text>
                </View>
                {decision ? (
                  <View style={[styles.doneBanner, { backgroundColor: DECISION_TEXT[decision].bg, borderRadius: theme.radii.md }]}>
                    <Text style={[styles.doneText, { color: DECISION_TEXT[decision].fg }]}>{DECISION_TEXT[decision].text}</Text>
                  </View>
                ) : (
                  <DecisionButtons
                    onDecide={(d) => setDecisions((prev) => ({ ...prev, [post.id]: d }))}
                    theme={theme}
                  />
                )}
              </View>
            </View>
          );
        })}
      </View>
    </AdminScreen>
  );
}

function DecisionButtons({ onDecide, theme }: { onDecide: (d: Decision) => void; theme: AppTheme }) {
  return (
    <View style={styles.actions}>
      <Text onPress={() => onDecide('keep')} style={[styles.actionBtn, styles.actionNeutral, { borderColor: theme.colors.border, borderRadius: theme.radii.md, color: theme.colors.text }]}>
        Garder
      </Text>
      <Text onPress={() => onDecide('hide')} style={[styles.actionBtn, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.md, color: theme.colors.onAccent }]}>
        Masquer
      </Text>
      <Text onPress={() => onDecide('ban')} style={[styles.actionBtn, styles.actionDanger, { borderColor: theme.colors.errorTint, borderRadius: theme.radii.md, color: theme.colors.error }]}>
        Suspendre
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
