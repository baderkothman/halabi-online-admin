import { beforeAll, describe, expect, it, vi } from 'vitest';
import { describeImageFileProblem, readImageFile } from './image-file';

/**
 * The API rejects anything outside these bounds too. These checks exist so the
 * operator hears about it before several megabytes go over the wire, which is
 * only worth anything if the two sets of rules agree.
 */

// jsdom implements neither half of the object-URL API; the preview URL is a
// browser concern and nothing here asserts on its value.
beforeAll(() => {
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:preview', revokeObjectURL: () => undefined }));
});

function file(bytes: number, type: string): File {
  return new File([new Uint8Array(bytes)], 'watch.jpg', { type });
}

describe('describeImageFileProblem', () => {
  it('accepts the formats a phone camera produces', () => {
    expect(describeImageFileProblem(file(1024, 'image/jpeg'))).toBeNull();
    expect(describeImageFileProblem(file(1024, 'image/webp'))).toBeNull();
  });

  it('rejects a format the image model cannot read', () => {
    expect(describeImageFileProblem(file(1024, 'image/heic'))).toMatch(/JPEG, PNG or WebP/);
  });

  it('names the actual size when the file is too large', () => {
    expect(describeImageFileProblem(file(13 * 1024 * 1024, 'image/png'))).toMatch(/13\.0 MB/);
  });
});

describe('readImageFile', () => {
  it('strips the data URL header, leaving only the payload the API expects', async () => {
    const read = await readImageFile(file(4, 'image/png'));
    expect(read.base64).not.toContain('base64,');
    expect(read.base64).toBe(btoa('\0\0\0\0'));
  });

  it('refuses an unsupported file rather than uploading it', async () => {
    await expect(readImageFile(file(4, 'application/pdf'))).rejects.toThrow(/JPEG, PNG or WebP/);
  });
});
