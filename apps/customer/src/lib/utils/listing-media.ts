import type { Listing } from '@/types/domain';

export type ListingGalleryItem = {
  altText?: string;
  id: string;
  kind: 'image' | 'video';
  thumbnailUrl?: string;
  url?: string;
};

function bySortOrder(left: { sortOrder: number }, right: { sortOrder: number }) {
  return left.sortOrder - right.sortOrder;
}

export function getListingImageMedia(listing: Listing) {
  return [...listing.media].filter((item) => item.type === 'image').sort(bySortOrder);
}

export function getPrimaryListingImage(listing: Listing) {
  return getListingImageMedia(listing)[0];
}

export function getListingGalleryItems(listing: Listing): ListingGalleryItem[] {
  const images = getListingImageMedia(listing).map((item) => ({
    altText: item.altText,
    id: item.id,
    kind: 'image' as const,
    thumbnailUrl: item.thumbnailUrl ?? item.url,
    url: item.url,
  }));

  if (!listing.linkedVideoUrl) {
    return images;
  }

  return [
    ...images,
    {
      altText: `${listing.title} video`,
      id: `${listing.id}-video`,
      kind: 'video',
      thumbnailUrl: images[0]?.thumbnailUrl ?? images[0]?.url,
      url: listing.linkedVideoUrl,
    },
  ];
}
