import type { DeliveryMode, Listing, SellerProfile, SellerType } from '@/types/domain';

export type ListingSearchFilters = {
  query?: string;
  type?: Listing['type'] | 'all';
  sellerType?: SellerType | 'all';
  deliveryMode?: DeliveryMode | 'all';
  countryCode?: string;
  city?: string;
};

export function searchListings(
  listings: Listing[],
  sellers: SellerProfile[],
  filters: ListingSearchFilters,
): Listing[] {
  return listings.filter((listing) => {
    const seller = sellers.find((item) => item.id === listing.sellerId);
    const query = filters.query?.trim().toLowerCase();
    const haystack = [
      listing.title,
      listing.description,
      listing.tags.join(' '),
      listing.categories.join(' '),
      listing.city,
      seller?.brandName ?? '',
    ]
      .join(' ')
      .toLowerCase();

    if (listing.status !== 'active') {
      return false;
    }
    if (query && !haystack.includes(query)) {
      return false;
    }
    if (filters.type && filters.type !== 'all' && listing.type !== filters.type) {
      return false;
    }
    if (filters.sellerType && filters.sellerType !== 'all' && seller?.type !== filters.sellerType) {
      return false;
    }
    if (
      filters.deliveryMode &&
      filters.deliveryMode !== 'all' &&
      listing.deliveryMode !== filters.deliveryMode
    ) {
      return false;
    }
    if (filters.countryCode && listing.countryCode !== filters.countryCode.toUpperCase()) {
      return false;
    }
    if (filters.city && listing.city.toLowerCase() !== filters.city.toLowerCase()) {
      return false;
    }
    return true;
  });
}
