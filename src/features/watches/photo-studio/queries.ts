import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { photoJobsApi } from '@/services/api';
import { queryKeys } from '@/services/query-keys';
import { isPhotoJobRunning } from '@/config/photo-styles';
import type { CreatePhotoJobInput, PhotoJob } from '@/types/domain';

/**
 * AI photo studio queries.
 *
 * The generation runs outside this application — the API hands the job to an
 * n8n workflow and the workflow reports its progress back over callbacks — so
 * the dashboard's only job is to ask for the current state often enough that
 * the progress bar moves, and to stop asking once it cannot change again.
 *
 * Two seconds is that cadence: a stage lasts tens of seconds, and one indexed
 * row read per poll costs the API nothing. Polling stops the moment the job
 * reaches a terminal status, which is what `isPhotoJobRunning` decides.
 */

const POLL_INTERVAL_MS = 2_000;

export function usePhotoJob(id: string | null) {
  return useQuery({
    queryKey: queryKeys.photoJobs.detail(id ?? ''),
    queryFn: ({ signal }) => photoJobsApi.getPhotoJob(id as string, signal),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const job = query.state.data;
      return job && !isPhotoJobRunning(job.status) ? false : POLL_INTERVAL_MS;
    },
    // A finished job is immutable, but a running one is stale the instant it
    // arrives — there is nothing worth reusing from the cache.
    staleTime: 0,
  });
}

/** Past jobs for one watch. Also how an already-running job is picked back up. */
export function useWatchPhotoJobs(watchId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.photoJobs.list(watchId ?? ''),
    queryFn: ({ signal }) => photoJobsApi.listPhotoJobs(watchId as string, signal),
    enabled: Boolean(watchId),
  });
}

export function useCreatePhotoJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePhotoJobInput) => photoJobsApi.createPhotoJob(input),
    onSuccess: (job: PhotoJob) => {
      // Seed the detail cache from the 202 response so the progress bar renders
      // at once rather than after the first poll lands.
      queryClient.setQueryData(queryKeys.photoJobs.detail(job.id), job);
      void queryClient.invalidateQueries({ queryKey: queryKeys.photoJobs.all });
    },
  });
}
