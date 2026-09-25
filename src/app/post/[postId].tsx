import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { PostMedia } from '@/components/feed/post-media';
import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/lib/utils/format';
import { PostRepository } from '@/repositories/post-repository';
import { useAosell } from '@/providers/aosell-provider';
import type { PostComment } from '@/types/domain';

export default function PostDetailScreen() {
  const params = useLocalSearchParams<{ postId?: string }>();
  const postId = Array.isArray(params.postId) ? params.postId[0] : params.postId ?? '';
  const theme = useTheme();
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
          <ThemedText type="headline">{seller?.brandName ?? t('listingDetail.sellerFallback')}</ThemedText>
          {post.mediaType !== 'text' && post.caption ? (
            <ThemedText type="body" themeColor="textSecondary">
              {post.caption}
            </ThemedText>
          ) : null}
        </View>
        {isOwner ? <AppButton label={t('common.delete')} variant="danger" onPress={handleDelete} /> : null}
      </View>

      <View style={[styles.commentsCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <ThemedText type="headline">{t('postDetail.commentsTitle')}</ThemedText>

        {comments.length ? (
          <View style={styles.commentList}>
            {comments.map((comment) => (
              <View key={comment.id} style={styles.commentRow}>
                <ThemedText type="button">{comment.authorDisplayNameSnapshot}</ThemedText>
                <ThemedText type="body">{comment.body}</ThemedText>
                <ThemedText type="bodySmall" themeColor="textSecondary">
                  {formatDate(comment.createdAt)}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : (
          <ThemedText type="bodySmall" themeColor="textSecondary">
            {t('postDetail.noComments')}
          </ThemedText>
        )}

        {currentUser ? (
          <View style={styles.commentInputRow}>
            <View style={styles.commentInputField}>
              <AppInput
                label={t('postDetail.commentPlaceholder')}
                multiline
                onChangeText={setDraft}
                value={draft}
              />
            </View>
            <AppButton disabled={isSubmitting || !draft.trim()} label={t('common.send')} onPress={() => void handleSend()} />
          </View>
        ) : null}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  commentsCard: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  commentList: {
    gap: Spacing.md,
  },
  commentRow: {
    gap: 2,
  },
  commentInputRow: {
    gap: Spacing.sm,
  },
  commentInputField: {
    minWidth: 0,
  },
});
