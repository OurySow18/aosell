import type { Listing, SellerProfile } from '@/types/domain';
import { searchListings } from '@/lib/search';

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: 'listing-1',
    sellerId: 'seller-1',
    type: 'product',
    title: 'Sourdough loaf',
    slug: 'sourdough-loaf',
    description: 'Fresh sourdough bread baked daily.',
    price: { amountCents: 500, currency: 'EUR' },
    status: 'active',
    deliveryMode: 'seller',
    countryCode: 'DE',
    city: 'Bremen',
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

function makeSeller(overrides: Partial<SellerProfile> = {}): SellerProfile {
  return {
    id: 'seller-1',
    ownerUserId: 'owner-1',
    type: 'shop',
    brandName: 'Bremen Bakery',
    countryCode: 'DE',
    city: 'Bremen',
    deliveryModes: ['seller'],
    verificationStatus: 'verified',
    tags: [],
    cuisineSpecialties: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('searchListings', () => {
  it('excludes listings that are not active', () => {
    const listings = [makeListing({ status: 'draft' })];
    expect(searchListings(listings, [], {})).toHaveLength(0);
  });

  it('matches a free-text query against title, description, tags and seller name', () => {
    const seller = makeSeller();
    const listings = [
      makeListing({ id: 'a', title: 'Sourdough loaf' }),
      makeListing({ id: 'b', title: 'Croissant', description: 'Buttery, flaky pastry.', tags: ['butter', 'pastry'] }),
    ];

    expect(searchListings(listings, [seller], { query: 'sourdough' }).map((l) => l.id)).toEqual(['a']);
    expect(searchListings(listings, [seller], { query: 'pastry' }).map((l) => l.id)).toEqual(['b']);
    expect(searchListings(listings, [seller], { query: 'bakery' }).map((l) => l.id)).toEqual(['a', 'b']);
  });

  it('filters by listing type, ignoring the "all" sentinel', () => {
    const listings = [
      makeListing({ id: 'a', type: 'meal' }),
      makeListing({ id: 'b', type: 'product' }),
    ];

    expect(searchListings(listings, [], { type: 'meal' }).map((l) => l.id)).toEqual(['a']);
    expect(searchListings(listings, [], { type: 'all' }).map((l) => l.id)).toEqual(['a', 'b']);
  });

  it('filters by seller type via the seller lookup', () => {
    const shop = makeSeller({ id: 'shop-1', type: 'shop' });
    const restaurant = makeSeller({ id: 'restaurant-1', type: 'restaurant' });
    const listings = [
      makeListing({ id: 'a', sellerId: 'shop-1' }),
      makeListing({ id: 'b', sellerId: 'restaurant-1' }),
    ];

    expect(
      searchListings(listings, [shop, restaurant], { sellerType: 'restaurant' }).map((l) => l.id),
    ).toEqual(['b']);
  });

  it('filters by delivery mode', () => {
    const listings = [
      makeListing({ id: 'a', deliveryMode: 'aosell' }),
      makeListing({ id: 'b', deliveryMode: 'seller' }),
    ];

    expect(searchListings(listings, [], { deliveryMode: 'aosell' }).map((l) => l.id)).toEqual(['a']);
  });

  it('filters by country code case-insensitively', () => {
    const listings = [makeListing({ countryCode: 'DE' })];

    expect(searchListings(listings, [], { countryCode: 'de' })).toHaveLength(1);
    expect(searchListings(listings, [], { countryCode: 'FR' })).toHaveLength(0);
  });

  it('filters by city case-insensitively', () => {
    const listings = [makeListing({ city: 'Bremen' })];

    expect(searchListings(listings, [], { city: 'bremen' })).toHaveLength(1);
    expect(searchListings(listings, [], { city: 'Berlin' })).toHaveLength(0);
  });
});
