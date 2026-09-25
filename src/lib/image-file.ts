/**
 * Reading an upload from disk, for the AI photo studio.
 *
 * The API takes the source photo as base64 inside a JSON body rather than as
 * multipart — it has no upload route and no object storage — so the file has to
 * be read here. Both the accepted types and the size ceiling mirror the API's
 * own checks; duplicating them buys an immediate, specific message instead of a
 * 400 after a several-megabyte round trip.
 */

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

export interface ReadImage {
  /** Raw base64, `data:` prefix removed — what `CreatePhotoJobInput` expects. */
  base64: string;
  mimeType: string;
  /** An object URL for the local preview. The caller must revoke it. */
  previewUrl: string;
  byteSize: number;
}

export class ImageFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageFileError';
  }
}

export function describeImageFileProblem(file: File): string | null {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return 'Choose a JPEG, PNG or WebP photograph.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `That photo is ${(file.size / (1024 * 1024)).toFixed(1)} MB. The limit is ${MAX_IMAGE_BYTES / (1024 * 1024)} MB.`;
  }
  if (file.size === 0) return 'That file is empty.';
  return null;
}

export async function readImageFile(file: File): Promise<ReadImage> {
  const problem = describeImageFileProblem(file);
  if (problem) throw new ImageFileError(problem);

  const dataUrl = await readAsDataUrl(file);
  const comma = dataUrl.indexOf(',');
  // A data URL without a comma is not a data URL; treating the whole string as
  // payload would send the `data:image/jpeg;base64` header as image bytes.
  if (comma < 0) throw new ImageFileError('That photo could not be read.');

  return {
    base64: dataUrl.slice(comma + 1),
    mimeType: file.type,
    previewUrl: URL.createObjectURL(file),
    byteSize: file.size,
  };
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new ImageFileError('That photo could not be read.'));
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.readAsDataURL(file);
  });
}
