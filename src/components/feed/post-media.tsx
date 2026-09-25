import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-theme';
import type { Post } from '@/types/domain';

const DOUBLE_TAP_WINDOW_MS = 280;

function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

export function PostMedia({ post, isActive = false, onDoubleTap }: { post: Post; isActive?: boolean; onDoubleTap?: () => void }) {
  const theme = useAppTheme();
  const lastTapRef = useRef(0);

  function handlePress() {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_WINDOW_MS) {
      onDoubleTap?.();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }

  if (post.mediaType === 'text') {
    return (
      <View style={[styles.textCard, { backgroundColor: theme.colors.text, borderRadius: theme.radii.xl }]}>
        <Text style={[styles.textCardCaption, { fontFamily: theme.typography.title.fontFamily }]}>{post.caption}</Text>
      </View>
    );
  }

  return (
    <Pressable onPress={handlePress} style={[styles.mediaFrame, { backgroundColor: theme.colors.accentTint }]}>
      {post.mediaType === 'video' && post.mediaUrl ? (
        <VideoMedia isActive={isActive} theme={theme} uri={post.mediaUrl} />
      ) : post.mediaUrl ? (
        <Image contentFit="cover" source={{ uri: post.mediaUrl }} style={StyleSheet.absoluteFillObject} transition={250} />
      ) : null}

      {post.mediaType === 'video' && typeof post.mediaDurationSeconds === 'number' ? (
        <View style={[styles.durationBadge, { backgroundColor: 'rgba(20,33,61,0.75)' }]}>
          <Text style={[styles.durationText, { fontFamily: theme.typography.micro.fontFamily }]}>
            {formatDuration(post.mediaDurationSeconds)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function VideoMedia({ uri, isActive, theme }: { uri: string; isActive: boolean; theme: ReturnType<typeof useAppTheme> }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  return (
    <>
      <VideoView contentFit="cover" nativeControls={false} player={player} pointerEvents="none" style={StyleSheet.absoluteFillObject} />
      {!isActive ? (
        <View style={[styles.playOverlay, { backgroundColor: 'rgba(20,33,61,0.7)' }]}>
          <View style={styles.playTriangle}>
            <SymbolView tintColor="#FFFFFF" size={26} name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }} />
          </View>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  mediaFrame: {
    width: '100%',
    aspectRatio: 390 / 360,
    overflow: 'hidden',
  },
  textCard: {
    minHeight: 220,
    padding: 20,
    justifyContent: 'center',
  },
  textCardCaption: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 28,
  },
  durationBadge: {
    position: 'absolute',
    right: 10,
    top: 10,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 14,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playTriangle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
