/**
 * Frontend domain types.
 *
 * These are written from the API's OpenAPI contract but are independent of it —
 * nothing here imports backend source. When the API changes, this file is the
 * one place that has to follow.
 *
 * Source of truth: `halabi-online-api/src/common/enums/domain.enums.ts` and the
 * Swagger document served at `${VITE_API_BASE_URL}/api/docs`.
 */

export const WATCH_AVAILABILITY = ['AVAILABLE', 'RESERVED', 'SOLD', 'UNAVAILABLE', 'ARCHIVED'] as const;
export type WatchAvailability = (typeof WATCH_AVAILABILITY)[number];

/**
 * Storefront visibility. The API models this as a separate `watch_visibility`
 * enum, NOT as part of availability: a watch can be AVAILABLE but PRIVATE
 * (in stock, not yet published) or PUBLIC but RESERVED.
 */
export const WATCH_VISIBILITY = ['PUBLIC', 'PRIVATE'] as const;
export type WatchVisibility = (typeof WATCH_VISIBILITY)[number];

export const INQUIRY_STATUS = [
  'NEW', 'VIEWED', 'CONTACTED', 'WAITING_FOR_CUSTOMER', 'IN_DISCUSSION', 'CLOSED', 'CONVERTED',
] as const;
export type InquiryStatus = (typeof INQUIRY_STATUS)[number];

export const CONTACT_METHOD = ['EMAIL', 'WHATSAPP', 'PHONE'] as const;
export type ContactMethod = (typeof CONTACT_METHOD)[number];

export const MESSAGE_SENDER = ['CUSTOMER', 'ADMIN', 'SYSTEM'] as const;
export type MessageSenderType = (typeof MESSAGE_SENDER)[number];

export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}

/**
 * A row from `GET /admin/dashboard/watches`.
 *
 * The list includes images so the edit form can manage unpublished watches too;
 * descriptions and specifications still come from the public detail endpoint.
 */
export interface AdminWatchListItem {
  id: string;
  slug: string;
  name: string;
  brand: string;
  reference: string | null;
  publicPrice: number | null;
  availability: WatchAvailability;
  visibility: WatchVisibility;
  featured: boolean;
  createdAt: string;
  images: WatchImage[];
}

/** `GET /public/watches/:slug` — the only endpoint exposing full watch detail. */
export interface WatchDetail {
  id: string;
  slug: string;
  name: string;
  brand: string;
  reference: string | null;
  price: number | null;
  description: string | null;
  availability: WatchAvailability;
  condition: string | null;
  movement: string | null;
  caseMaterial: string | null;
  dialColor: string | null;
  featured: boolean;
  category: { slug: string; name: string } | null;
  images: WatchImage[];
  createdAt: string;
}

export interface WatchImage {
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface WatchImageInput {
  url: string;
  alt?: string | undefined;
  isPrimary?: boolean | undefined;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  displayOrder?: number;
}

/** The mutable fields accepted by `POST`/`PATCH /admin/dashboard/watches`. */
export interface WatchWriteInput {
  slug: string;
  name: string;
  brand: string;
  reference?: string | undefined;
  description?: string | undefined;
  publicPrice?: number | undefined;
  availability?: WatchAvailability | undefined;
  condition?: string | undefined;
  movement?: string | undefined;
  caseMaterial?: string | undefined;
  dialColor?: string | undefined;
  categoryId?: string | undefined;
  featured?: boolean | undefined;
  visibility?: WatchVisibility | undefined;
  images?: WatchImageInput[] | undefined;
}

/** A row from `GET /admin/inquiries`. */
export interface InquiryListItem {
  id: string;
  customerName: string;
  email: string | null;
  phone: string | null;
  status: InquiryStatus;
  createdAt: string;
  watchSlug: string;
  watchName: string;
  watchBrand: string;
  /** Customer messages with no `read_at`. The API returns this as a string count. */
  unreadCount: number;
}

export interface InquiryMessage {
  id: string;
  senderType: MessageSenderType;
  body: string;
  createdAt: string;
  readAt: string | null;
}

/** `GET /admin/inquiries/:id`. */
export interface InquiryDetail {
  id: string;
  status: InquiryStatus;
  customerName: string;
  email: string | null;
  phone: string | null;
  preferredContactMethod: ContactMethod;
  message: string;
  createdAt: string;
  watchId: string;
  watchSlug: string;
  watchName: string;
  watchBrand: string;
  messages: InquiryMessage[];
}

/** `GET /admin/dashboard/summary`. Snake-cased by the API's raw SQL aliases. */
export interface DashboardSummary {
  available: number;
  sold: number;
  new_inquiries: number;
  active_discussions: number;
}
