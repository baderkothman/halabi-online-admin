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
 * Note that this list projection is narrower than the public watch detail: the
 * admin list query selects only these columns. Anything else — images,
 * specifications, category name — needs the public detail endpoint by slug.
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

/**
 * AI photo studio.
 *
 * A job is created when an administrator uploads a phone photo; an n8n workflow
 * then analyses it, generates commercial product photography with OpenAI,
 * quality-checks the result against the original and corrects it if needed. The
 * dashboard polls the job for the progress the workflow reports.
 */
export const PHOTO_JOB_STATUS = [
  'QUEUED', 'ANALYZING', 'GENERATING', 'REVIEWING', 'CORRECTING', 'SUCCEEDED', 'NEEDS_REVIEW', 'FAILED',
] as const;
export type PhotoJobStatus = (typeof PHOTO_JOB_STATUS)[number];

export const PRODUCT_PHOTO_STYLE = [
  'LUXURY_BOX', 'WHITE_ECOMMERCE', 'BLACK_MARBLE', 'DARK_PREMIUM', 'GOLD_LUXURY', 'SOCIAL_AD',
] as const;
export type ProductPhotoStyle = (typeof PRODUCT_PHOTO_STYLE)[number];

export interface PhotoJob {
  id: string;
  watchId: string | null;
  style: ProductPhotoStyle;
  status: PhotoJobStatus;
  /** 0–100, reported by the automation as it moves between stages. */
  progress: number;
  /** A sentence naming what is happening right now, for the progress bar. */
  stage: string;
  attempts: number;
  /** The quality-control score, 0–100. Present once a result has been delivered. */
  qualityScore: number | null;
  sourceUrl: string;
  resultUrl: string | null;
  /** The quality-control verdict, kept verbatim so a rejection can be explained. */
  review: PhotoJobReview | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

/**
 * The subset of the inspector's JSON this application reads.
 *
 * Every field is required here even though the automation may omit any of
 * them: the API service fills the gaps with empty lists, so a screen never has
 * to distinguish "no invented details" from "the key was absent".
 */
export interface PhotoJobReview {
  approved: boolean;
  score: number | null;
  inventedDetails: string[];
  missingDetails: string[];
  changedDetails: string[];
  visualArtifacts: string[];
  correctionInstructions: string[];
}

export interface CreatePhotoJobInput {
  watchId?: string;
  style: ProductPhotoStyle;
  mimeType: string;
  /** Raw base64, without the `data:` prefix. */
  imageBase64: string;
  altText?: string;
}
