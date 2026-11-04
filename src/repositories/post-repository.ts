import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  orderBy,
  query,
  limit as queryLimit,
  setDoc,
  updateDoc,
  where,
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

  // The global feed above is capped at 50 posts app-wide, so filtering it for
  // "my posts" (profile grid, stats) silently drops older posts once enough
  // other activity pushes them out of that window — this queries Firestore
  // directly for just this seller's posts instead, with no such cap.
  subscribeBySeller(sellerId: string, onChange: (posts: Post[]) => void) {
    return onSnapshot(
      query(collection(db, 'posts'), where('sellerId', '==', sellerId), orderBy('createdAt', 'desc')),
      (snapshot) => {
        onChange(snapshot.docs.map((item) => fromFirestorePostDoc(item.id, item.data() as FirestorePostDoc)));
      },
      (error) => {
        logFirestoreListenerError('post.bySeller', error);
        onChange([]);
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

  // Lets a caller reserve the post's id before it exists in Firestore, e.g.
  // to embed it in a Storage upload path so a server-side process (video
  // transcoding) can later find the right post document to update.
  generateId(): string {
    return doc(collection(db, 'posts')).id;
  },

  async create(
    seller: SellerProfile,
    input: {
      postId?: string;
      mediaType: PostMediaType;
      mediaUrl?: string;
      mediaWidth?: number;
      mediaHeight?: number;
      mediaDurationSeconds?: number;
      caption: string;
      linkTarget?: PostLinkTarget;
      mediaProcessingStatus?: Post['mediaProcessingStatus'];
    }
  ): Promise<Post> {
    const ref = input.postId ? doc(db, 'posts', input.postId) : doc(collection(db, 'posts'));
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
      mediaProcessingStatus: input.mediaProcessingStatus,
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

  // Only caption and linkTarget are editable post-publish (matches
  // firestore.rules' isSafePostUpdate, which locks every other field) — the
  // media itself can't be swapped once a post is live. updateDoc only sends
  // the keys given here, so every other field is left untouched and equals
  // resource.data as the rule requires; deleteField() is needed (an
  // `undefined` value would be silently dropped, leaving the old link set)
  // to actually clear linkTarget when switching a post back to "share only".
  async update(postId: string, input: { caption: string; linkTarget?: PostLinkTarget }) {
    await updateDoc(doc(db, 'posts', postId), {
      caption: input.caption,
      linkTarget: input.linkTarget ?? deleteField(),
      updatedAt: createTimestamp(),
    });
  },

  async delete(postId: string) {
    await deleteDoc(doc(db, 'posts', postId));
  },
};
