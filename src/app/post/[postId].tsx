import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { PostMedia } from '@/components/feed/post-media';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { useLocale } from '@/hooks/use-locale';
import { useAppTheme } from '@/hooks/use-theme';
import { formatDate } from '@/lib/utils/format';
import { PostRepository } from '@/repositories/post-repository';
import { useAosell } from '@/providers/aosell-provider';
import type { PostComment } from '@/types/domain';

export default function PostDetailScreen() {
  const params = useLocalSearchParams<{ postId?: string }>();
  const postId = Array.isArray(params.postId) ? params.postId[0] : params.postId ?? '';
  const theme = useAppTheme();
  const { t } = useLocale();
  const { currentUser, currentSellerProfile, getPostById, getSellerById, addPostComment, deletePost } = useAosell();
  const post = getPostById(postId);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [draft, setDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!postId) {
      return;
    }
    return PostRepository.subscribeComments(postId, setComments);
  }, [postId]);

  if (!post) {
    return (
      <AppScreen>
        <EmptyState title={t('postDetail.notFoundTitle')} description={t('postDetail.notFoundDescription')} />
      </AppScreen>
    );
  }

  const seller = getSellerById(post.sellerId);
  const isOwner = currentSellerProfile?.id === post.sellerId;

  async function handleSend() {
    if (!draft.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await addPostComment(postId, draft.trim());
      setDraft('');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDelete() {
    Alert.alert(t('postDetail.deleteTitle'), t('postDetail.deleteDescription'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void deletePost(postId).then(() => router.back());
        },
      },
    ]);
  }

  return (
    <AppScreen>
      <PostMedia post={post} />

      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.heading, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
            {seller?.brandName ?? t('listingDetail.sellerFallback')}
          </Text>
          {post.mediaType !== 'text' && post.caption ? (
            <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.typography.body.fontFamily }]}>{post.caption}</Text>
          ) : null}
        </View>
        {isOwner ? <AppButton label={t('common.delete')} variant="danger" onPress={handleDelete} /> : null}
      </View>

      <View style={[styles.commentsCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
        <Text style={[styles.heading, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
          {t('postDetail.commentsTitle')}
        </Text>

        {comments.length ? (
          <View style={styles.commentList}>
            {comments.map((comment) => (
              <View key={comment.id} style={styles.commentRow}>
                <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
                  {comment.authorDisplayNameSnapshot}
                </Text>
                <Text style={[styles.body, { color: theme.colors.text, fontFamily: theme.typography.body.fontFamily }]}>{comment.body}</Text>
                <Text style={[styles.bodySmall, { color: theme.colors.textMuted }]}>{formatDate(comment.createdAt)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.bodySmall, { color: theme.colors.textMuted }]}>{t('postDetail.noComments')}</Text>
        )}

        {currentUser ? (
          <View style={styles.commentInputRow}>
            <View style={styles.commentInputField}>
              <AppInput label={t('postDetail.commentPlaceholder')} multiline onChangeText={setDraft} value={draft} />
            </View>
            <AppButton disabled={isSubmitting || !draft.trim()} label={t('common.send')} onPress={() => void handleSend()} />
          </View>
        ) : null}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headerCopy: { flex: 1, gap: 4 },
  commentsCard: { borderWidth: 1, padding: 16, gap: 16 },
  commentList: { gap: 12 },
  commentRow: { gap: 2 },
  commentInputRow: { gap: 8 },
  commentInputField: { minWidth: 0 },
  heading: { fontSize: 17, lineHeight: 22 },
  body: { fontSize: 15, lineHeight: 21 },
  bodySmall: { fontSize: 13, lineHeight: 18 },
  label: { fontSize: 15, lineHeight: 20 },
});
