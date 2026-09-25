import type { Listing } from '@/types/domain';
import { buildPostShareMessage, buildPostShareUrl, canSellerLinkTarget } from '@/lib/posts';

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: 'listing-1',
    sellerId: 'seller-1',
    type: 'meal',
    title: 'Jollof Dinner Box',
    slug: 'jollof-dinner-box',
    description: 'Smoky jollof rice, grilled chicken, plantains, and fresh salad.',
    price: { amountCents: 1890, currency: 'EUR' },
    status: 'active',
    deliveryMode: 'aosell',
    countryCode: 'DE',
    city: 'Berlin',
    tags: [],
    categories: [],
    media: [],
    attributes: [],
    inventory: { isUnlimited: true },
    condiments: [],
    isFeatured: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('buildPostShareUrl', () => {
  it('builds an aosell:// deep link for the given post id', () => {
    expect(buildPostShareUrl('post-42')).toBe('aosell://post/post-42');
  });
});

describe('buildPostShareMessage', () => {
  it('prefixes the caption before the share link', () => {
    expect(buildPostShareMessage({ caption: 'Fresh jollof tonight!', postId: 'post-1' })).toBe(
      'Fresh jollof tonight!\n\naosell://post/post-1',
    );
  });

  it('omits the leading blank line when the caption is empty or whitespace-only', () => {
    expect(buildPostShareMessage({ caption: '', postId: 'post-1' })).toBe('aosell://post/post-1');
    expect(buildPostShareMessage({ caption: '   ', postId: 'post-1' })).toBe('aosell://post/post-1');
  });
});

describe('canSellerLinkTarget', () => {
  it('allows linking to a listing the seller owns', () => {
    const listing = makeListing({ id: 'listing-1', sellerId: 'seller-1' });
    expect(
      canSellerLinkTarget({
        sellerId: 'seller-1',
        linkTarget: { type: 'listing', listingId: 'listing-1', sellerId: 'seller-1' },
        ownedListings: [listing],
      }),
    ).toBe(true);
  });

  it('rejects linking to a listing owned by a different seller', () => {
    const listing = makeListing({ id: 'listing-1', sellerId: 'seller-2' });
    expect(
      canSellerLinkTarget({
        sellerId: 'seller-1',
        linkTarget: { type: 'listing', listingId: 'listing-1', sellerId: 'seller-2' },
        ownedListings: [listing],
      }),
    ).toBe(false);
  });

  it('rejects a listingId not present in ownedListings even if the sellerId matches', () => {
    expect(
      canSellerLinkTarget({
        sellerId: 'seller-1',
        linkTarget: { type: 'listing', listingId: 'listing-missing', sellerId: 'seller-1' },
        ownedListings: [makeListing({ id: 'listing-1', sellerId: 'seller-1' })],
      }),
    ).toBe(false);
  });

  it('allows linking to the seller own shop', () => {
    expect(
      canSellerLinkTarget({
        sellerId: 'seller-1',
        linkTarget: { type: 'seller', sellerId: 'seller-1' },
        ownedListings: [],
      }),
    ).toBe(true);
  });

  it('rejects linking to a different shop', () => {
    expect(
      canSellerLinkTarget({
        sellerId: 'seller-1',
        linkTarget: { type: 'seller', sellerId: 'seller-2' },
        ownedListings: [],
      }),
    ).toBe(false);
  });
});
