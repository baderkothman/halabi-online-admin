import type { PhotoJobStatus, ProductPhotoStyle } from '@/types/domain';
import type { StatusTone } from './availability';

/**
 * How the AI photo studio is labelled.
 *
 * The style keys are the contract between three places — this dashboard, the
 * API's `ProductPhotoStyle` enum, and the preset table inside the n8n workflow.
 * The prose below is the operator's description of each preset; the prompt
 * text itself lives in the workflow, because that is where it is used.
 */
export const photoStylePresentation: Record<ProductPhotoStyle, { label: string; description: string }> = {
  LUXURY_BOX: { label: 'Luxury box', description: 'Inside a presentation box on a premium tabletop. The catalogue hero shot.' },
  WHITE_ECOMMERCE: { label: 'White e-commerce', description: 'Seamless white, soft contact shadow, no props. The storefront default.' },
  BLACK_MARBLE: { label: 'Black marble', description: 'Dark polished marble and controlled warm highlights. Advertisement-led.' },
  DARK_PREMIUM: { label: 'Dark premium', description: 'Charcoal gradient with edge lighting. Dramatic, but still true to colour.' },
  GOLD_LUXURY: { label: 'Gold luxury', description: 'Warm editorial styling with restrained gold accents.' },
  SOCIAL_AD: { label: 'Social media', description: 'Portrait-friendly with room left around the piece for graphic text.' },
};

/**
 * Stage labelling for the progress bar.
 *
 * `terminal` is what the dashboard polls against: while it is false the job is
 * still moving and worth asking about again.
 */
export const photoJobPresentation: Record<PhotoJobStatus, { label: string; tone: StatusTone; terminal: boolean }> = {
  QUEUED: { label: 'Queued', tone: 'info', terminal: false },
  ANALYZING: { label: 'Reading the photo', tone: 'info', terminal: false },
  GENERATING: { label: 'Generating', tone: 'info', terminal: false },
  REVIEWING: { label: 'Checking the result', tone: 'info', terminal: false },
  CORRECTING: { label: 'Correcting', tone: 'notice', terminal: false },
  SUCCEEDED: { label: 'Ready', tone: 'positive', terminal: true },
  NEEDS_REVIEW: { label: 'Needs your review', tone: 'notice', terminal: true },
  FAILED: { label: 'Failed', tone: 'danger', terminal: true },
};

export function isPhotoJobRunning(status: PhotoJobStatus): boolean {
  return !photoJobPresentation[status].terminal;
}
