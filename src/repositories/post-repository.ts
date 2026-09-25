import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  limit as queryLimit,
  setDoc,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/config';
import { logFirestoreListenerError } from '@/lib/firebase/listener-errors';
import {
  createTimestamp,
  fromFirestorePostCommentDoc,
  fromFirestorePostDoc,
  toFirestorePostCommentDoc,
  toFirestorePostDoc,
} from '@/lib/firebase/mappers';
import { demoPosts } from '@/services/mock-data';
import type { Post, PostComment, PostLinkTarget, PostMediaType, SellerProfile } from '@/types/domain';
import type { FirestorePostCommentDoc, FirestorePostDoc } from '@/types/firestore';

export const PostRepository = {
  subscribeFeed(onChange: (posts: Post[]) => void) {
    return onSnapshot(
      query(collection(db, 'posts'), orderBy('createdAt', 'desc'), queryLimit(50)),
      (snapshot) => {
        onChange(snapshot.docs.map((item) => fromFirestorePostDoc(item.id, item.data() as FirestorePostDoc)));
      },
      (error) => {
        logFirestoreListenerError('post.feed', error);
        onChange(demoPosts);
      }
    );
  },

  subscribeComments(postId: string, onChange: (comments: PostComment[]) => void) {
    return onSnapshot(
      query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc')),
      (snapshot) => {
        onChange(
          snapshot.docs.map((item) => fromFirestorePostCommentDoc(item.id, item.data() as FirestorePostCommentDoc))
        );
      },
      (error) => {
        logFirestoreListenerError('post.comments', error);
        onChange([]);
      }
    );
  },

  subscribeLikeStatus(postId: string, userId: string, onChange: (liked: boolean) => void) {
    return onSnapshot(
      doc(db, 'posts', postId, 'likes', userId),
      (snapshot) => {
        onChange(snapshot.exists());
      },
      (error) => {
        logFirestoreListenerError('post.likeStatus', error);
        onChange(false);
      }
    );
  },

  async create(
    seller: SellerProfile,
    input: {
      mediaType: PostMediaType;
      mediaUrl?: string;
      mediaWidth?: number;
      mediaHeight?: number;
      mediaDurationSeconds?: number;
      caption: string;
      linkTarget: PostLinkTarget;
    }
  ): Promise<Post> {
    const ref = doc(collection(db, 'posts'));
    const post: Post = {
      id: ref.id,
      sellerId: seller.id,
      mediaType: input.mediaType,
      mediaUrl: input.mediaUrl,
      mediaWidth: input.mediaWidth,
      mediaHeight: input.mediaHeight,
      mediaDurationSeconds: input.mediaDurationSeconds,
      caption: input.caption,
      linkTarget: input.linkTarget,
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(ref, toFirestorePostDoc(post));
    return post;
  },

  async setLiked(postId: string, userId: string, liked: boolean) {
    const ref = doc(db, 'posts', postId, 'likes', userId);

    if (liked) {
      await setDoc(ref, { postId, userId, createdAt: createTimestamp() });
    } else {
      await deleteDoc(ref);
    }
  },

  async addComment(
    postId: string,
    author: { userId: string; displayName: string },
    body: string
  ): Promise<PostComment> {
    const ref = doc(collection(db, 'posts', postId, 'comments'));
    const comment: PostComment = {
      id: ref.id,
      postId,
      authorUserId: author.userId,
      authorDisplayNameSnapshot: author.displayName,
      body,
      createdAt: new Date().toISOString(),
    };

    await setDoc(ref, toFirestorePostCommentDoc(comment));
    return comment;
  },

  async delete(postId: string) {
    await deleteDoc(doc(db, 'posts', postId));
  },
};
