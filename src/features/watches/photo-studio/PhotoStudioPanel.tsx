import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Box, Button, LinearProgress, MenuItem, Stack, TextField, Typography,
} from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { useQueryClient } from '@tanstack/react-query';
import { StatusChip } from '@/components/data-display/StatusChip';
import { Section } from '../WatchFormFields';
import { useCreatePhotoJob, usePhotoJob, useWatchPhotoJobs } from './queries';
import { isPhotoJobRunning, photoJobPresentation, photoStylePresentation } from '@/config/photo-styles';
import { queryKeys } from '@/services/query-keys';
import { toDisplayMessage } from '@/services/api';
import { describeImageFileProblem, readImageFile, type ReadImage } from '@/lib/image-file';
import { PRODUCT_PHOTO_STYLE, type PhotoJob, type ProductPhotoStyle } from '@/types/domain';

/**
 * Turn a phone photo into commercial product photography.
 *
 * The work happens in an n8n workflow against the OpenAI API: the photo is
 * analysed, regenerated in the chosen presentation style, compared against the
 * original by a quality-control pass, and corrected up to three times. None of
 * that is synchronous — the upload returns a job id, and this panel follows the
 * job's reported progress until it is finished.
 *
 * Two consequences shape the component:
 *
 * 1. The progress bar is DETERMINATE and driven by the workflow's own progress
 *    reports, never by a timer. A bar that animates on its own is a lie about
 *    how far along a two-minute job is.
 * 2. A running job is owned by the server, not by this screen. On mount the
 *    panel adopts whatever job is still running for this watch, so closing the
 *    form and coming back does not lose it.
 */
export function PhotoStudioPanel({ watchId }: { watchId: string }) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);

  const [style, setStyle] = useState<ProductPhotoStyle>('WHITE_ECOMMERCE');
  const [upload, setUpload] = useState<ReadImage | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const history = useWatchPhotoJobs(watchId);
  const createJob = useCreatePhotoJob();
  const job = usePhotoJob(jobId);

  // Adopt a job that was already running when this screen opened. `jobId` is
  // only ever set from a job the server actually reports, so this cannot
  // resurrect one that has already finished.
  const runningElsewhere = history.data?.find((entry) => isPhotoJobRunning(entry.status));
  useEffect(() => {
    if (!jobId && runningElsewhere) setJobId(runningElsewhere.id);
  }, [jobId, runningElsewhere]);

  // A finished job changes two things this screen shows: the watch's gallery,
  // because the API filed the approved image into `watch_images`, and the strip
  // of earlier results.
  const finishedStatus = job.data && !isPhotoJobRunning(job.data.status) ? job.data.status : null;
  useEffect(() => {
    if (!finishedStatus) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.photoJobs.list(watchId) });
    if (finishedStatus === 'SUCCEEDED') void queryClient.invalidateQueries({ queryKey: queryKeys.watches.all });
  }, [finishedStatus, queryClient, watchId]);

  // Object URLs are held by the browser until they are revoked; the preview is
  // replaced on every new pick, so releasing the previous one is not optional.
  useEffect(() => () => { if (upload) URL.revokeObjectURL(upload.previewUrl); }, [upload]);

  const current = job.data;
  const busy = createJob.isPending || Boolean(current && isPhotoJobRunning(current.status));

  const pick = async (file: File | undefined) => {
    if (!file) return;
    const rejection = describeImageFileProblem(file);
    if (rejection) {
      setProblem(rejection);
      return;
    }
    setProblem(null);
    const read = await readImageFile(file);
    setUpload((previous) => {
      if (previous) URL.revokeObjectURL(previous.previewUrl);
      return read;
    });
  };

  const generate = async () => {
    if (!upload) return;
    setProblem(null);
    try {
      const created = await createJob.mutateAsync({ watchId, style, mimeType: upload.mimeType, imageBase64: upload.base64 });
      setJobId(created.id);
    } catch (error) {
      // A 503 here means PHOTO_AUTOMATION_WEBHOOK_URL is unset on the API — the
      // studio is switched off rather than broken, and the API says so.
      setProblem(toDisplayMessage(error));
    }
  };

  const startOver = () => {
    setJobId(null);
    setProblem(null);
    setUpload((previous) => {
      if (previous) URL.revokeObjectURL(previous.previewUrl);
      return null;
    });
    if (fileInput.current) fileInput.current.value = '';
  };

  return (
    <Section title="AI product photography">
      <Typography variant="body2" color="ink.muted">
        Upload a plain photograph of the piece. It is analysed, re-photographed in the chosen presentation style and
        checked against the original before anything is saved — the real dial, logo, bracelet and proportions are
        preserved, never redesigned.
      </Typography>

      {problem && <Alert severity="error" role="alert" onClose={() => setProblem(null)}>{problem}</Alert>}

      {current ? (
        <JobState job={current} onStartOver={startOver} />
      ) : (
        <Stack spacing={1.75}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Box
              sx={{
                width: 96, height: 96, flexShrink: 0, borderRadius: 1, overflow: 'hidden',
                border: 1, borderColor: 'line.subtle', bgcolor: 'surfaceTone.sunken',
                display: 'grid', placeItems: 'center',
              }}
            >
              {upload ? (
                <Box component="img" src={upload.previewUrl} alt="The photograph you selected" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <AutoAwesomeOutlinedIcon sx={{ fontSize: 20, color: 'ink.muted' }} />
              )}
            </Box>

            <Stack spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
              <Box>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(event) => void pick(event.target.files?.[0])}
                />
                <Button type="button" variant="outlined" size="small" onClick={() => fileInput.current?.click()}>
                  {upload ? 'Choose a different photo' : 'Choose photo'}
                </Button>
                <Typography variant="caption" color="ink.muted" sx={{ display: 'block', mt: 0.75 }}>
                  {upload ? `${(upload.byteSize / (1024 * 1024)).toFixed(1)} MB · ${upload.mimeType.replace('image/', '').toUpperCase()}` : 'JPEG, PNG or WebP, up to 12 MB.'}
                </Typography>
              </Box>

              <TextField
                select
                size="small"
                label="Presentation style"
                value={style}
                onChange={(event) => setStyle(event.target.value as ProductPhotoStyle)}
                helperText={photoStylePresentation[style].description}
              >
                {PRODUCT_PHOTO_STYLE.map((key) => (
                  <MenuItem key={key} value={key}>{photoStylePresentation[key].label}</MenuItem>
                ))}
              </TextField>
            </Stack>
          </Stack>

          <Box>
            <Button type="button" variant="contained" size="small" disabled={!upload || busy} onClick={() => void generate()}>
              {createJob.isPending ? 'Sending…' : 'Generate photograph'}
            </Button>
          </Box>
        </Stack>
      )}

      <PreviousResults jobs={history.data ?? []} currentJobId={jobId} />
    </Section>
  );
}

/** One running or finished job: the progress bar, then whatever it produced. */
function JobState({ job, onStartOver }: { job: PhotoJob; onStartOver: () => void }) {
  const presentation = photoJobPresentation[job.status];
  const running = isPhotoJobRunning(job.status);

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="center">
        <StatusChip label={presentation.label} tone={presentation.tone} size="small" />
        <Typography variant="body2" color="ink.muted" sx={{ flex: 1, minWidth: 0 }}>
          {job.stage}
          {job.attempts > 1 && running ? ` · attempt ${job.attempts}` : ''}
        </Typography>
        {running && <Typography variant="caption" color="ink.muted">{job.progress}%</Typography>}
      </Stack>

      {running && (
        <LinearProgress
          variant="determinate"
          value={job.progress}
          aria-label={`${presentation.label}: ${job.progress}% complete`}
          sx={{ height: 4, borderRadius: 2 }}
        />
      )}

      {job.status === 'FAILED' && (
        <Alert severity="error" role="alert">
          {job.error ?? 'The photograph could not be generated.'}
        </Alert>
      )}

      {job.status === 'NEEDS_REVIEW' && (
        <Alert severity="warning">
          Quality control scored this {job.qualityScore ?? 0} out of 100 after {job.attempts} attempts, so it was NOT
          added to the gallery. Look at it below and either try another style or photograph the piece again.
          <ReviewNotes job={job} />
        </Alert>
      )}

      {job.status === 'SUCCEEDED' && (
        <Alert severity="success">
          Scored {job.qualityScore ?? 0} out of 100 and added to this watch&apos;s gallery.
        </Alert>
      )}

      {job.resultUrl && (
        <Box
          component="img"
          src={job.resultUrl}
          alt="The generated product photograph"
          sx={{ width: '100%', maxWidth: 360, borderRadius: 1, border: 1, borderColor: 'line.subtle' }}
        />
      )}

      {!running && (
        <Box>
          <Button type="button" variant="outlined" size="small" onClick={onStartOver}>Generate another</Button>
        </Box>
      )}
    </Stack>
  );
}

/**
 * What the inspector objected to.
 *
 * Only shown on a rejection, and only the categories that actually have
 * entries — an empty "Missing details" heading tells an operator nothing.
 */
function ReviewNotes({ job }: { job: PhotoJob }) {
  const notes = useMemo(() => {
    const review = job.review;
    if (!review) return [];
    return [
      ...review.changedDetails.map((detail) => `Changed: ${detail}`),
      ...review.inventedDetails.map((detail) => `Invented: ${detail}`),
      ...review.missingDetails.map((detail) => `Missing: ${detail}`),
      ...review.visualArtifacts.map((detail) => `Artifact: ${detail}`),
    ].slice(0, 6);
  }, [job.review]);

  if (notes.length === 0) return null;
  return (
    <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.5 }}>
      {notes.map((note) => (
        <Typography key={note} component="li" variant="caption" sx={{ display: 'list-item' }}>{note}</Typography>
      ))}
    </Box>
  );
}

/** A thumbnail strip of earlier results, so a discarded style can be revisited. */
function PreviousResults({ jobs, currentJobId }: { jobs: PhotoJob[]; currentJobId: string | null }) {
  const finished = jobs.filter((job) => job.resultUrl && job.id !== currentJobId);
  if (finished.length === 0) return null;

  return (
    <Box>
      <Typography variant="caption" color="ink.muted" sx={{ display: 'block', mb: 0.75 }}>
        Earlier results
      </Typography>
      <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
        {finished.map((job) => (
          <Box
            key={job.id}
            component="a"
            href={job.resultUrl ?? undefined}
            target="_blank"
            rel="noreferrer"
            title={`${photoStylePresentation[job.style].label} · scored ${job.qualityScore ?? 0}`}
            sx={{ flexShrink: 0, lineHeight: 0, borderRadius: 1, overflow: 'hidden', border: 1, borderColor: 'line.subtle' }}
          >
            <Box component="img" src={job.resultUrl ?? ''} alt={`${photoStylePresentation[job.style].label} result`} sx={{ width: 56, height: 56, objectFit: 'cover' }} />
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
