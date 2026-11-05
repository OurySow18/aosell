import type { Listing, PostLinkTarget } from '@/types/domain';

export function buildPostShareUrl(postId: string): string {
  return `aosell://post/${postId}`;
}

export function buildPostShareMessage(params: { caption: string; postId: string }): string {
  const trimmed = params.caption.trim();
  const prefix = trimmed ? `${trimmed}\n\n` : '';
  return `${prefix}${buildPostShareUrl(params.postId)}`;
}

export function canSellerLinkTarget(params: {
  sellerId: string;
  linkTarget: PostLinkTarget;
  ownedListings: Listing[];
}): boolean {
  const { sellerId, linkTarget, ownedListings } = params;

  if (linkTarget.type === 'seller') {
    return linkTarget.sellerId === sellerId;
  }

  return ownedListings.some(
    (listing) => listing.id === linkTarget.listingId && listing.sellerId === sellerId,
  );
}
