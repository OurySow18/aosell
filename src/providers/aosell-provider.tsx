import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import type {
  Address,
  AppUser,
  Cart,
  Condiment,
  Cuisine,
  DeliveryMode,
  Dish,
  Listing,
  ListingCondimentEntry,
  ListingStatus,
  Notification,
  Order,
  OrderStatus,
  Post,
  PostComment,
  PostLinkTarget,
  PostMediaType,
  SellerProfile,
  SellerType,
  UserProfile,
} from '@/types/domain';
import { AuthRepository } from '@/repositories/auth-repository';
import { CartRepository } from '@/repositories/cart-repository';
import { CondimentRepository } from '@/repositories/condiment-repository';
import { DishRepository } from '@/repositories/dish-repository';
import { FollowRepository } from '@/repositories/follow-repository';
import { ListingRepository } from '@/repositories/listing-repository';
import { NotificationRepository } from '@/repositories/notification-repository';
import { OrderRepository } from '@/repositories/order-repository';
import { PostRepository } from '@/repositories/post-repository';
import { SellerRepository } from '@/repositories/seller-repository';
import { UserProfileSeed, UserRepository } from '@/repositories/user-repository';
import { demoCondiments, demoDishes, demoListings, demoPosts, demoSellers } from '@/services/mock-data';
import { translate } from '@/lib/i18n';
import { getNextStatuses } from '@/lib/utils/order';
import { computeCartTotals, resolveAddToCart, resolvePromoCode } from '@/lib/cart';
import { resolveCondimentEntries } from '@/lib/condiments';
import { slugifyDishName } from '@/lib/dishes';
import { searchListings as filterListings, type ListingSearchFilters } from '@/lib/search';
import { DEFAULT_CITY, DEFAULT_COUNTRY_CODE } from '@/constants/location';

type DishSelection =
  | { kind: 'none' }
  | { kind: 'existing'; dishId: string }
  | { kind: 'new'; cuisine: Cuisine; name: string; description: string; imageUrl?: string };

type SaveListingInput = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  amountCents: number;
  type: Listing['type'];
  deliveryMode: DeliveryMode;
  city: string;
  countryCode: string;
  status: ListingStatus;
  tags: string[];
  categories: string[];
  hasVideo: boolean;
  dishSelection: DishSelection;
  condimentInputs: string[];
};

type CreateSellerProfileInput = {
  type: SellerType;
  brandName: string;
  description: string;
  city: string;
  countryCode: string;
  deliveryModes: DeliveryMode[];
  cuisineSpecialties: Cuisine[];
};

type AddToCartResult = {
  ok: boolean;
  requiresReplace: boolean;
  requiresAuth?: boolean;
};

type SignInInput = {
  email: string;
  password: string;
};

type SignUpInput = SignInInput & {
  firstName: string;
  lastName: string;
  role: 'buyer' | 'seller';
};

type AosellContextValue = {
  authReady: boolean;
  currentUser: AppUser | null;
  userProfile: UserProfile | null;
  addresses: Address[];
  sellers: SellerProfile[];
  currentSellerProfile: SellerProfile | null;
  listings: Listing[];
  dishes: Dish[];
  condiments: Condiment[];
  feedPosts: Post[];
  cart: Cart | null;
  orders: Order[];
  notifications: Notification[];
  signIn: (input: SignInInput) => Promise<AppUser | null>;
  signUp: (input: SignUpInput) => Promise<AppUser | null>;
  logout: () => Promise<void>;
  createSellerProfile: (input: CreateSellerProfileInput) => Promise<SellerProfile | null>;
  setSellerOpen: (isOpen: boolean) => Promise<void>;
  saveListing: (input: SaveListingInput) => Promise<Listing | null>;
  getListingById: (id: string) => Listing | undefined;
  getSellerById: (id: string) => SellerProfile | undefined;
  getDishById: (id: string) => Dish | undefined;
  getPostById: (id: string) => Post | undefined;
  searchListings: (filters: ListingSearchFilters) => Listing[];
  createPost: (input: {
    mediaType: PostMediaType;
    mediaUrl?: string;
    mediaWidth?: number;
    mediaHeight?: number;
    mediaDurationSeconds?: number;
    caption: string;
    linkTarget: PostLinkTarget;
  }) => Promise<Post | null>;
  toggleLike: (postId: string, liked: boolean) => Promise<void>;
  addPostComment: (postId: string, body: string) => Promise<PostComment | null>;
  deletePost: (postId: string) => Promise<void>;
  addToCart: (listingId: string, forceReplace?: boolean) => Promise<AddToCartResult>;
  updateCartQuantity: (listingId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  applyPromoCode: (code: string) => Promise<{ ok: boolean }>;
  followedSellerIds: string[];
  toggleFollow: (sellerId: string, following: boolean) => Promise<void>;
  addAddress: (address: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Address | null>;
  placeOrder: (addressId: string) => Promise<Order | null>;
  advanceOrderStatus: (orderId: string, nextStatus: OrderStatus) => Promise<void>;
  getOrderById: (orderId: string) => Order | undefined;
  markNotificationRead: (notificationId: string) => Promise<void>;
};

const AosellContext = createContext<AosellContextValue | undefined>(undefined);

function mergeById<T extends { id: string }>(...groups: T[][]) {
  const registry = new Map<string, T>();

  for (const group of groups) {
    for (const item of group) {
      registry.set(item.id, item);
    }
  }

  return Array.from(registry.values()).sort((left, right) =>
    'createdAt' in left && 'createdAt' in right
      ? String(right.createdAt).localeCompare(String(left.createdAt))
      : 0
  );
}

export function AosellProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [sellers, setSellers] = useState<SellerProfile[]>(demoSellers);
  const [currentSellerProfile, setCurrentSellerProfile] = useState<SellerProfile | null>(null);
  const [publicListings, setPublicListings] = useState<Listing[]>(
    demoListings.filter((listing) => listing.status === 'active')
  );
  const [ownedListings, setOwnedListings] = useState<Listing[]>([]);
  const [dishes, setDishes] = useState<Dish[]>(demoDishes);
  const [condiments, setCondiments] = useState<Condiment[]>(demoCondiments);
  const [feedPosts, setFeedPosts] = useState<Post[]>(demoPosts);
  const [cart, setCart] = useState<Cart | null>(null);
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [followedSellerIds, setFollowedSellerIds] = useState<string[]>([]);

  const listings = mergeById(publicListings, ownedListings);
  const orders = mergeById(buyerOrders, sellerOrders);

  useEffect(() => {
    const unsubscribeAuth = AuthRepository.subscribe(
      (user) => {
        setCurrentUser(user);

        if (!user) {
          setUserProfile(null);
          setAddresses([]);
          setCurrentSellerProfile(null);
          setOwnedListings([]);
          setCart(null);
          setBuyerOrders([]);
          setSellerOrders([]);
          setNotifications([]);
          setFollowedSellerIds([]);
        }
      },
      () => {
        setAuthReady(true);
      }
    );

    const unsubscribeSellers = SellerRepository.subscribePublic(setSellers);
    const unsubscribeListings = ListingRepository.subscribePublicActive(setPublicListings);
    const unsubscribeDishes = DishRepository.subscribeCatalog(setDishes);
    const unsubscribeCondiments = CondimentRepository.subscribeCatalog(setCondiments);
    const unsubscribePosts = PostRepository.subscribeFeed(setFeedPosts);

    return () => {
      unsubscribeAuth();
      unsubscribeSellers();
      unsubscribeListings();
      unsubscribeDishes();
      unsubscribeCondiments();
      unsubscribePosts();
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    let isActive = true;

    UserRepository.ensureProfile(currentUser)
      .then((profile) => {
        if (isActive) {
          setUserProfile((current) => current ?? profile);
        }
      })
      .catch(() => undefined);

    const unsubscribeProfile = UserRepository.subscribeProfile(currentUser.id, setUserProfile);
    const unsubscribeAddresses = UserRepository.subscribeAddresses(currentUser.id, setAddresses);
    const unsubscribeCart = CartRepository.subscribeCurrent(currentUser.id, setCart);
    const unsubscribeBuyerOrders = OrderRepository.subscribeForBuyer(currentUser.id, setBuyerOrders);
    const unsubscribeNotifications = NotificationRepository.subscribeForUser(
      currentUser.id,
      setNotifications
    );
    const unsubscribeOwnedSeller = SellerRepository.subscribeOwned(
      currentUser.id,
      setCurrentSellerProfile
    );
    const unsubscribeFollows = FollowRepository.subscribeFollowedSellerIds(currentUser.id, setFollowedSellerIds);

    return () => {
      isActive = false;
      unsubscribeProfile();
      unsubscribeAddresses();
      unsubscribeCart();
      unsubscribeBuyerOrders();
      unsubscribeNotifications();
      unsubscribeOwnedSeller();
      unsubscribeFollows();
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentSellerProfile) {
      setOwnedListings([]);
      setSellerOrders([]);
      return;
    }

    const unsubscribeListings = ListingRepository.subscribeBySeller(
      currentSellerProfile.id,
      setOwnedListings
    );
    const unsubscribeOrders = OrderRepository.subscribeForSeller(
      currentSellerProfile.id,
      setSellerOrders
    );

    return () => {
      unsubscribeListings();
      unsubscribeOrders();
    };
  }, [currentSellerProfile?.id]);

  useEffect(() => {
    setUserProfile((current) => (current ? { ...current, addresses } : current));
  }, [addresses, userProfile?.userId]);

  async function signIn(input: SignInInput) {
    const user = await AuthRepository.signIn(input);
    await UserRepository.ensureProfile(user);
    setCurrentUser(user);
    return user;
  }

  async function signUp(input: SignUpInput) {
    const user = await AuthRepository.signUp({
      email: input.email,
      password: input.password,
      role: input.role,
    });
    const profileSeed: UserProfileSeed = {
      firstName: input.firstName,
      lastName: input.lastName,
      displayName: `${input.firstName.trim()} ${input.lastName.trim()}`.trim(),
      city: DEFAULT_CITY,
      countryCode: DEFAULT_COUNTRY_CODE,
    };

    await UserRepository.ensureProfile(user, profileSeed);
    setCurrentUser(user);
    return user;
  }

  async function logout() {
    await AuthRepository.signOut();
    setCurrentUser(null);
    setCurrentSellerProfile(null);
    setCart(null);
  }

  async function createSellerProfile(input: CreateSellerProfileInput) {
    if (!currentUser) {
      return null;
    }

    const profile = await SellerRepository.create(currentUser, input);
    setCurrentSellerProfile(profile);
    setSellers((current) => mergeById(current, [profile]));
    return profile;
  }

  async function setSellerOpen(isOpen: boolean) {
    if (!currentSellerProfile) {
      return;
    }

    await SellerRepository.setOpenStatus(currentSellerProfile.id, isOpen);
    setCurrentSellerProfile((current) => (current ? { ...current, isOpen } : current));
    setSellers((current) => current.map((seller) => (seller.id === currentSellerProfile.id ? { ...seller, isOpen } : seller)));
  }

  async function saveListing(input: SaveListingInput) {
    if (!currentSellerProfile) {
      return null;
    }

    const { matched, toCreate } = resolveCondimentEntries(input.condimentInputs, condiments);
    const createdCondiments = toCreate.length
      ? await CondimentRepository.createMany(currentSellerProfile, toCreate)
      : [];
    if (createdCondiments.length) {
      setCondiments((current) => mergeById(current, createdCondiments));
    }
    const resolvedCondiments: ListingCondimentEntry[] = [...matched, ...createdCondiments].map(
      (condiment) => ({ condimentId: condiment.id, nameSnapshot: condiment.name })
    );

    let dishId: string | undefined;
    if (input.dishSelection.kind === 'existing') {
      dishId = input.dishSelection.dishId;
    } else if (input.dishSelection.kind === 'new') {
      const newDish = await DishRepository.create(currentSellerProfile, {
        cuisine: input.dishSelection.cuisine,
        name: input.dishSelection.name,
        slug: slugifyDishName(input.dishSelection.name),
        description: input.dishSelection.description,
        imageUrl: input.dishSelection.imageUrl,
        defaultCondimentIds: resolvedCondiments.map((entry) => entry.condimentId),
      });
      setDishes((current) => mergeById(current, [newDish]));
      dishId = newDish.id;
    }

    const existing = input.id ? getListingById(input.id) : undefined;
    const listing = await ListingRepository.save(
      currentSellerProfile,
      { ...input, dishId, condiments: resolvedCondiments },
      existing
    );

    setOwnedListings((current) => mergeById(current, [listing]));
    if (listing.status === 'active') {
      setPublicListings((current) => mergeById(current, [listing]));
    } else {
      setPublicListings((current) => current.filter((item) => item.id !== listing.id));
    }

    return listing;
  }

  function getListingById(id: string) {
    return listings.find((listing) => listing.id === id);
  }

  function getSellerById(id: string) {
    return sellers.find((seller) => seller.id === id);
  }

  function getDishById(id: string) {
    return dishes.find((dish) => dish.id === id);
  }

  function searchListings(filters: ListingSearchFilters) {
    return filterListings(listings, sellers, filters);
  }

  function getPostById(id: string) {
    return feedPosts.find((post) => post.id === id);
  }

  async function createPost(input: {
    mediaType: PostMediaType;
    mediaUrl?: string;
    mediaWidth?: number;
    mediaHeight?: number;
    mediaDurationSeconds?: number;
    caption: string;
    linkTarget: PostLinkTarget;
  }) {
    if (!currentSellerProfile) {
      return null;
    }

    const post = await PostRepository.create(currentSellerProfile, input);
    setFeedPosts((current) => mergeById(current, [post]));
    return post;
  }

  async function toggleLike(postId: string, liked: boolean) {
    if (!currentUser) {
      return;
    }

    await PostRepository.setLiked(postId, currentUser.id, liked);
    // Optimistic bump: the Cloud Function's own FieldValue.increment write will
    // land a moment later via the feed's onSnapshot and settle on the same
    // value — this isn't double-counting, just an instant local echo.
    setFeedPosts((current) =>
      current.map((post) =>
        post.id === postId ? { ...post, likeCount: post.likeCount + (liked ? 1 : -1) } : post
      )
    );
  }

  async function addPostComment(postId: string, body: string) {
    if (!currentUser || !userProfile) {
      return null;
    }

    const comment = await PostRepository.addComment(
      postId,
      { userId: currentUser.id, displayName: userProfile.displayName },
      body
    );
    setFeedPosts((current) =>
      current.map((post) => (post.id === postId ? { ...post, commentCount: post.commentCount + 1 } : post))
    );
    return comment;
  }

  async function deletePost(postId: string) {
    await PostRepository.delete(postId);
    setFeedPosts((current) => current.filter((post) => post.id !== postId));
  }

  async function addToCart(listingId: string, forceReplace = false): Promise<AddToCartResult> {
    if (!currentUser) {
      return { ok: false, requiresReplace: false, requiresAuth: true };
    }

    const listing = getListingById(listingId);
    const decision = resolveAddToCart({ cart, listing, forceReplace });

    if (decision.kind === 'not-found') {
      return { ok: false, requiresReplace: false };
    }
    if (decision.kind === 'requires-replace') {
      return { ok: false, requiresReplace: true };
    }

    const nextCart = computeCartTotals(decision.items, decision.sellerId, {
      buyerUserId: currentUser.id,
      createdAt: cart?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      promoCode: forceReplace ? undefined : cart?.promoCode,
    });
    await CartRepository.save(nextCart);
    setCart(nextCart);
    return { ok: true, requiresReplace: false };
  }

  async function updateCartQuantity(listingId: string, quantity: number) {
    if (!currentUser || !cart) {
      return;
    }

    const nextItems = cart.items
      .map((item) => (item.listingId === listingId ? { ...item, quantity } : item))
      .filter((item) => item.quantity > 0);

    if (!nextItems.length) {
      await CartRepository.clear(currentUser.id);
      setCart(null);
      return;
    }

    const nextCart = computeCartTotals(nextItems, cart.sellerId, {
      buyerUserId: currentUser.id,
      createdAt: cart.createdAt,
      updatedAt: new Date().toISOString(),
      promoCode: cart.promoCode,
    });
    await CartRepository.save(nextCart);
    setCart(nextCart);
  }

  async function clearCart() {
    if (!currentUser) {
      return;
    }

    await CartRepository.clear(currentUser.id);
    setCart(null);
  }

  async function applyPromoCode(code: string): Promise<{ ok: boolean }> {
    if (!currentUser || !cart) {
      return { ok: false };
    }

    if (!resolvePromoCode(code)) {
      return { ok: false };
    }

    const nextCart = computeCartTotals(cart.items, cart.sellerId, {
      buyerUserId: currentUser.id,
      createdAt: cart.createdAt,
      updatedAt: new Date().toISOString(),
      promoCode: code,
    });
    await CartRepository.save(nextCart);
    setCart(nextCart);
    return { ok: true };
  }

  async function toggleFollow(sellerId: string, following: boolean) {
    if (!currentUser) {
      return;
    }

    await FollowRepository.setFollowing(currentUser.id, sellerId, following);
    setFollowedSellerIds((current) =>
      following ? Array.from(new Set([...current, sellerId])) : current.filter((id) => id !== sellerId)
    );
  }

  async function addAddress(address: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!currentUser) {
      return null;
    }

    const nextAddress = await UserRepository.addAddress(currentUser.id, address);
    setAddresses((current) => mergeById(current, [nextAddress]));
    setUserProfile((current) =>
      current
        ? {
            ...current,
            addresses: mergeById(current.addresses, [nextAddress]),
            updatedAt: new Date().toISOString(),
          }
        : current
    );
    return nextAddress;
  }

  async function placeOrder(addressId: string) {
    if (!cart || !currentUser) {
      return null;
    }

    const address = addresses.find((item) => item.id === addressId);
    if (!address) {
      return null;
    }

    const createdAt = new Date().toISOString();
    const order: Order = {
      id: '',
      buyerUserId: currentUser.id,
      sellerId: cart.sellerId,
      status: 'pending_payment',
      items: cart.items.map((item, index) => ({
        id: `${item.listingId}-${index}`,
        listingId: item.listingId,
        titleSnapshot: item.titleSnapshot,
        unitPriceSnapshot: item.unitPriceSnapshot,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
      })),
      subtotal: cart.subtotal,
      deliveryFee: cart.deliveryFee,
      total: cart.total,
      currency: 'EUR',
      deliveryMode: getListingById(cart.items[0]?.listingId ?? '')?.deliveryMode ?? 'aosell',
      deliveryAddress: address,
      timeline: [
        { status: 'created', at: createdAt },
        { status: 'pending_payment', at: createdAt },
      ],
      createdAt,
      updatedAt: createdAt,
    };

    const createdOrder = await OrderRepository.create(order);
    setBuyerOrders((current) => mergeById(current, [createdOrder]));

    await NotificationRepository.create(currentUser.id, {
      type: 'order_created',
      title: translate('notifications.orderCreatedTitle'),
      body: translate('notifications.orderCreatedBody', { orderId: createdOrder.id }),
      isRead: false,
      data: { orderId: createdOrder.id },
    });

    await clearCart();
    return createdOrder;
  }

  async function advanceOrderStatus(orderId: string, nextStatus: OrderStatus) {
    const existing = orders.find((order) => order.id === orderId);
    if (!existing || !getNextStatuses(existing.status).includes(nextStatus)) {
      return;
    }

    const nextOrder = await OrderRepository.advanceStatus(existing, nextStatus);
    setBuyerOrders((current) => mergeById(current, [nextOrder]));
    setSellerOrders((current) => mergeById(current, [nextOrder]));
  }

  function getOrderById(orderId: string) {
    return orders.find((order) => order.id === orderId);
  }

  async function markNotificationRead(notificationId: string) {
    if (!currentUser) {
      return;
    }

    await NotificationRepository.markRead(currentUser.id, notificationId);
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification
      )
    );
  }

  return (
    <AosellContext.Provider
      value={{
        authReady,
        currentUser,
        userProfile,
        addresses,
        sellers,
        currentSellerProfile,
        listings,
        dishes,
        condiments,
        feedPosts,
        cart,
        orders,
        notifications,
        signIn,
        signUp,
        logout,
        createSellerProfile,
        setSellerOpen,
        saveListing,
        getListingById,
        getSellerById,
        getDishById,
        getPostById,
        searchListings,
        createPost,
        toggleLike,
        addPostComment,
        deletePost,
        addToCart,
        updateCartQuantity,
        clearCart,
        applyPromoCode,
        followedSellerIds,
        toggleFollow,
        addAddress,
        placeOrder,
        advanceOrderStatus,
        getOrderById,
        markNotificationRead,
      }}>
      {children}
    </AosellContext.Provider>
  );
}

export function useAosell() {
  const context = useContext(AosellContext);
  if (!context) {
    throw new Error('useAosell must be used within AosellProvider');
  }
  return context;
}
