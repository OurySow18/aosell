import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { Listing } from '@/types/domain';

import { ThemedText } from '@/components/themed-text';
import { StatusPill } from '@/components/ui/status-pill';
import { Radius, Spacing } from '@/constants/theme';
import { getListingTypeLabel } from '@/lib/i18n';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { getListingGalleryItems } from '@/lib/utils/listing-media';

export function ListingGallery({ listing }: { listing: Listing }) {
  const theme = useTheme();
  const { t } = useLocale();
  const galleryItems = getListingGalleryItems(listing);
  const imageCount = galleryItems.filter((item) => item.kind === 'image').length;
  const [selectedId, setSelectedId] = useState(galleryItems[0]?.id ?? '');
  const activeItem = galleryItems.find((item) => item.id === selectedId) ?? galleryItems[0];
  const activeIndex = Math.max(
    0,
    galleryItems.findIndex((item) => item.id === activeItem?.id),
  );

  useEffect(() => {
    setSelectedId(galleryItems[0]?.id ?? '');
  }, [galleryItems[0]?.id, listing.id]);

  return (
    <View style={styles.shell}>
      <View style={[styles.hero, { backgroundColor: theme.earth }]}>
        {activeItem?.thumbnailUrl ? (
          <Image
            contentFit="cover"
            source={{ uri: activeItem.thumbnailUrl }}
            style={StyleSheet.absoluteFillObject}
            transition={250}
          />
        ) : null}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: activeItem?.thumbnailUrl ? theme.overlay : theme.earth },
          ]}
        />
        <View style={styles.heroTop}>
          <StatusPill label={getListingTypeLabel(listing.type)} tone="brand" />
          <View style={styles.heroBadges}>
            {listing.isFeatured ? <StatusPill label={t('common.featured')} tone="neutral" /> : null}
            {activeItem?.kind === 'video' ? <StatusPill label={t('common.video')} tone="warning" /> : null}
            <View style={styles.mediaCount}>
              <ThemedText type="button" style={{ color: theme.background }}>
                {activeIndex + 1}/{galleryItems.length || 1}
              </ThemedText>
            </View>
          </View>
        </View>
        {activeItem?.kind === 'video' ? (
          <View style={styles.videoMarker}>
            <View style={styles.videoIcon}>
              <SymbolView
                tintColor={theme.earth}
                size={22}
                name={{ ios: 'play.fill', android: 'play_arrow', web: 'play.fill' }}
              />
            </View>
            <ThemedText type="button" style={{ color: theme.background }}>
              {t('gallery.videoPreview')}
            </ThemedText>
          </View>
        ) : null}
        <View style={styles.heroFooter}>
          <View style={styles.footerChip}>
            <ThemedText type="button">
              {activeItem?.kind === 'video'
                ? t('gallery.tapToReview')
                : t('gallery.photosAvailable', { count: imageCount || 1 })}
            </ThemedText>
          </View>
          <View style={styles.footerCopy}>
            <ThemedText type="headline" numberOfLines={2} style={{ color: theme.background }}>
              {listing.title}
            </ThemedText>
            <ThemedText type="bodySmall" style={{ color: theme.background }}>
              {t('gallery.swipeHint')}
            </ThemedText>
          </View>
        </View>
      </View>

      {galleryItems.length > 1 ? (
        <ScrollView
          contentContainerStyle={styles.thumbnailRow}
          horizontal
          showsHorizontalScrollIndicator={false}>
          {galleryItems.map((item, index) => {
            const active = item.id === activeItem?.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setSelectedId(item.id)}
                style={[
                  styles.thumbnail,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: active ? theme.forestGreen : theme.border,
                  },
                  active && styles.thumbnailActive,
                ]}>
                {item.thumbnailUrl ? (
                  <Image
                    contentFit="cover"
                    source={{ uri: item.thumbnailUrl }}
                    style={StyleSheet.absoluteFillObject}
                    transition={200}
                  />
                ) : null}
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    {
                      backgroundColor: item.thumbnailUrl
                        ? theme.overlay
                        : theme.backgroundSelected,
                    },
                  ]}
                />
                <View style={styles.thumbnailMeta}>
                  <ThemedText type="label" style={{ color: theme.background }}>
                    {item.kind === 'video' ? t('common.video') : t('gallery.photoNumber', { index: index + 1 })}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    gap: Spacing.md,
  },
  hero: {
    minHeight: 420,
    borderRadius: Radius.large,
    overflow: 'hidden',
    padding: Spacing.xl,
    justifyContent: 'space-between',
    gap: Spacing.lg,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  heroBadges: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  mediaCount: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(20, 20, 20, 0.3)',
  },
  videoMarker: {
    alignItems: 'center',
    alignSelf: 'center',
    gap: Spacing.sm,
  },
  videoIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  heroFooter: {
    maxWidth: 520,
    gap: Spacing.md,
  },
  footerChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  footerCopy: {
    gap: Spacing.xs,
  },
  thumbnailRow: {
    gap: Spacing.sm,
  },
  thumbnail: {
    width: 112,
    height: 84,
    borderWidth: 2,
    borderRadius: Radius.medium,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: Spacing.sm,
  },
  thumbnailActive: {
    transform: [{ scale: 0.98 }],
  },
  thumbnailMeta: {
    gap: Spacing.xs,
  },
});
