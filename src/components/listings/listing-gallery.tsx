import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Listing } from '@/types/domain';

import { useAppTheme } from '@/hooks/use-theme';
import { getListingTypeLabel } from '@/lib/i18n';
import { useLocale } from '@/hooks/use-locale';
import { getListingGalleryItems } from '@/lib/utils/listing-media';

export function ListingGallery({ listing }: { listing: Listing }) {
  const theme = useAppTheme();
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
      <View style={[styles.hero, { backgroundColor: theme.colors.text, borderRadius: theme.radii.sheet }]}>
        {activeItem?.thumbnailUrl ? (
          <Image contentFit="cover" source={{ uri: activeItem.thumbnailUrl }} style={StyleSheet.absoluteFillObject} transition={250} />
        ) : null}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: activeItem?.thumbnailUrl ? theme.colors.overlay : theme.colors.text },
          ]}
        />
        <View style={styles.heroTop}>
          <View style={styles.heroLead}>
            <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.94)' }]}>
              <SymbolView tintColor={theme.colors.text} size={19} name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} />
            </Pressable>
            <View style={[styles.pill, { backgroundColor: theme.colors.accent }]}>
              <Text style={[styles.pillText, { color: theme.colors.onAccent, fontFamily: theme.typography.label.fontFamily }]}>
                {getListingTypeLabel(listing.type)}
              </Text>
            </View>
          </View>
          <View style={styles.heroBadges}>
            {listing.isFeatured ? (
              <View style={[styles.pill, { backgroundColor: 'rgba(255,255,255,0.94)' }]}>
                <Text style={[styles.pillText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
                  {t('common.featured')}
                </Text>
              </View>
            ) : null}
            {activeItem?.kind === 'video' ? (
              <View style={[styles.pill, { backgroundColor: theme.colors.warning }]}>
                <Text style={[styles.pillText, { color: '#FFFFFF', fontFamily: theme.typography.label.fontFamily }]}>
                  {t('common.video')}
                </Text>
              </View>
            ) : null}
            <View style={styles.mediaCount}>
              <Text style={[styles.mediaCountText, { color: '#FFFFFF', fontFamily: theme.typography.label.fontFamily }]}>
                {activeIndex + 1}/{galleryItems.length || 1}
              </Text>
            </View>
          </View>
        </View>
        {activeItem?.kind === 'video' ? (
          <View style={styles.videoMarker}>
            <View style={[styles.videoIcon, { backgroundColor: 'rgba(255,255,255,0.92)' }]}>
              <SymbolView tintColor={theme.colors.text} size={22} name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }} />
            </View>
            <Text style={[styles.videoMarkerText, { color: '#FFFFFF', fontFamily: theme.typography.label.fontFamily }]}>
              {t('gallery.videoPreview')}
            </Text>
          </View>
        ) : null}
        <View style={styles.heroFooter}>
          <View style={[styles.footerChip, { backgroundColor: theme.colors.accent }]}>
            <Text style={[styles.footerChipText, { color: theme.colors.onAccent, fontFamily: theme.typography.label.fontFamily }]}>
              {activeItem?.kind === 'video' ? t('gallery.tapToReview') : t('gallery.photosAvailable', { count: imageCount || 1 })}
            </Text>
          </View>
          <View style={styles.footerCopy}>
            <Text
              numberOfLines={2}
              style={[styles.footerTitle, { color: '#FFFFFF', fontFamily: theme.typography.heading.fontFamily }]}>
              {listing.title}
            </Text>
            <Text style={[styles.footerHint, { color: '#FFFFFF', fontFamily: theme.typography.caption.fontFamily }]}>
              {t('gallery.swipeHint')}
            </Text>
          </View>
        </View>
      </View>

      {galleryItems.length > 1 ? (
        <ScrollView contentContainerStyle={styles.thumbnailRow} horizontal showsHorizontalScrollIndicator={false}>
          {galleryItems.map((item, index) => {
            const active = item.id === activeItem?.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setSelectedId(item.id)}
                style={[
                  styles.thumbnail,
                  {
                    borderRadius: theme.radii.md,
                    backgroundColor: theme.colors.surfaceMuted,
                    borderColor: active ? theme.colors.success : theme.colors.border,
                  },
                  active && styles.thumbnailActive,
                ]}>
                {item.thumbnailUrl ? (
                  <Image contentFit="cover" source={{ uri: item.thumbnailUrl }} style={StyleSheet.absoluteFillObject} transition={200} />
                ) : null}
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    { backgroundColor: item.thumbnailUrl ? theme.colors.overlay : theme.colors.surfaceMuted },
                  ]}
                />
                <View style={styles.thumbnailMeta}>
                  <Text style={[styles.thumbnailMetaText, { color: '#FFFFFF', fontFamily: theme.typography.label.fontFamily }]}>
                    {item.kind === 'video' ? t('common.video') : t('gallery.photoNumber', { index: index + 1 })}
                  </Text>
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
  shell: { gap: 12 },
  hero: { minHeight: 520, overflow: 'hidden', padding: 20, justifyContent: 'space-between', gap: 16 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  heroLead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backButton: { width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  heroBadges: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  pillText: { fontSize: 13, lineHeight: 18 },
  mediaCount: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(20,20,20,0.3)' },
  mediaCountText: { fontSize: 13, lineHeight: 18 },
  videoMarker: { alignItems: 'center', alignSelf: 'center', gap: 8 },
  videoIcon: { width: 64, height: 64, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  videoMarkerText: { fontSize: 13, lineHeight: 18 },
  heroFooter: { maxWidth: 520, gap: 12 },
  footerChip: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  footerChipText: { fontSize: 13, lineHeight: 18 },
  footerCopy: { gap: 4 },
  footerTitle: { fontSize: 20, lineHeight: 26 },
  footerHint: { fontSize: 13, lineHeight: 18 },
  thumbnailRow: { gap: 8 },
  thumbnail: { width: 112, height: 84, borderWidth: 2, overflow: 'hidden', justifyContent: 'flex-end', padding: 8 },
  thumbnailActive: { transform: [{ scale: 0.98 }] },
  thumbnailMeta: { gap: 4 },
  thumbnailMetaText: { fontSize: 13, lineHeight: 18 },
});
