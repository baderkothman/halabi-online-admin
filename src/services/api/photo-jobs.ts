import { requestData } from './client';
import { asArray, asRecord, toBoolean, toCount, toEnum, toNumberOrNull, toStringOrNull, toText } from '@/lib/coerce';
import {
  PHOTO_JOB_STATUS, PRODUCT_PHOTO_STYLE,
  type CreatePhotoJobInput, type PhotoJob, type PhotoJobReview,
} from '@/types/domain';

/**
 * AI photo studio endpoints.
 *
 * `POST /admin/dashboard/photo-jobs` answers 202 with a job that has barely
 * started: the generation runs in an n8n workflow and reports back to the API
 * over its own callbacks. Everything after the upload is polling — see
 * `features/watches/photo-studio/queries.ts` for the cadence.
 *
 * The upload is JSON with a base64 payload rather than multipart, because that
 * is the shape the API accepts; `lib/image-file.ts` owns the encoding.
 */

function toReview(raw: unknown): PhotoJobReview | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const row = asRecord(raw);
  const list = (value: unknown) => asArray(value).map((entry) => toText(entry)).filter(Boolean);
  return {
    approved: toBoolean(row.approved),
    score: toNumberOrNull(row.score),
    inventedDetails: list(row.inventedDetails),
    missingDetails: list(row.missingDetails),
    changedDetails: list(row.changedDetails),
    visualArtifacts: list(row.visualArtifacts),
    correctionInstructions: list(row.correctionInstructions),
  };
}

function toPhotoJob(raw: unknown): PhotoJob {
  const row = asRecord(raw);
  return {
    id: toText(row.id),
    watchId: toStringOrNull(row.watchId),
    style: toEnum(row.style, PRODUCT_PHOTO_STYLE, 'WHITE_ECOMMERCE'),
    status: toEnum(row.status, PHOTO_JOB_STATUS, 'QUEUED'),
    // `progress` is a smallint and `attempts` a smallint; `pg` hands both back
    // as numbers, but a clamp here keeps the progress bar out of a bad state
    // whatever arrives.
    progress: Math.min(100, Math.max(0, toCount(row.progress))),
    stage: toText(row.stage, 'Working'),
    attempts: toCount(row.attempts),
    qualityScore: toNumberOrNull(row.qualityScore),
    sourceUrl: toText(row.sourceUrl),
    resultUrl: toStringOrNull(row.resultUrl),
    review: toReview(row.review),
    error: toStringOrNull(row.error),
    createdAt: toText(row.createdAt),
    completedAt: toStringOrNull(row.completedAt),
  };
}

export async function createPhotoJob(input: CreatePhotoJobInput): Promise<PhotoJob> {
  // A source photo is megabytes of base64; the default 15 s client timeout is
  // generous for the request itself but not for a slow uplink.
  const data = await requestData<unknown>('/admin/dashboard/photo-jobs', { method: 'POST', body: input, timeoutMs: 60_000 });
  return toPhotoJob(data);
}

export async function getPhotoJob(id: string, signal?: AbortSignal): Promise<PhotoJob> {
  const data = await requestData<unknown>(`/admin/dashboard/photo-jobs/${encodeURIComponent(id)}`, signal ? { signal } : {});
  return toPhotoJob(data);
}

export async function listPhotoJobs(watchId: string, signal?: AbortSignal): Promise<PhotoJob[]> {
  const data = await requestData<unknown>('/admin/dashboard/photo-jobs', { query: { watchId }, ...(signal ? { signal } : {}) });
  return asArray(data).map(toPhotoJob);
}
