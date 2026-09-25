import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPhotoJob, getPhotoJob } from './photo-jobs';

/**
 * The photo job is read by a progress bar, so the two things that matter are
 * that the numbers are numbers and that a half-filled quality-control verdict
 * still produces a whole `PhotoJobReview`.
 */

function mockJson(body: unknown) {
  return vi.fn().mockResolvedValue({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify(body)) });
}

afterEach(() => vi.restoreAllMocks());

describe('getPhotoJob', () => {
  it('clamps progress into the range the bar can render', async () => {
    // A determinate LinearProgress given 140 renders past its own track.
    vi.stubGlobal('fetch', mockJson({ data: { id: 'a', status: 'GENERATING', progress: 140 } }));
    expect((await getPhotoJob('a')).progress).toBe(100);
  });

  it('fills in the verdict lists the automation left out', async () => {
    vi.stubGlobal('fetch', mockJson({ data: { id: 'a', status: 'NEEDS_REVIEW', review: { score: '72', changedDetails: ['dial text'] } } }));
    const job = await getPhotoJob('a');
    expect(job.review?.score).toBe(72);
    expect(job.review?.changedDetails).toEqual(['dial text']);
    expect(job.review?.missingDetails).toEqual([]);
  });

  it('falls back to QUEUED for a status this build has never heard of', async () => {
    vi.stubGlobal('fetch', mockJson({ data: { id: 'a', status: 'UPSCALING' } }));
    expect((await getPhotoJob('a')).status).toBe('QUEUED');
  });
});

describe('createPhotoJob', () => {
  it('posts the base64 payload and returns the accepted job', async () => {
    const fetchMock = mockJson({ data: { id: 'job-1', status: 'QUEUED', progress: 0, stage: 'Queued' } });
    vi.stubGlobal('fetch', fetchMock);

    const job = await createPhotoJob({ watchId: 'w1', style: 'LUXURY_BOX', mimeType: 'image/jpeg', imageBase64: 'AAAA' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toMatchObject({ style: 'LUXURY_BOX', imageBase64: 'AAAA' });
    expect(job.id).toBe('job-1');
  });
});
