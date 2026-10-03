import { useEffect, useState } from 'react';
import { Alert, Box, Button, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { PageBody } from '@/app/layouts/AdminLayout';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ErrorState } from '@/components/feedback/ErrorState';
import {
  AvailabilityFields, BasicInformationFields, ClassificationFields, ImageFields, PricingFields, SpecificationFields,
} from './WatchFormFields';
import { useCreateWatch, useUpdateWatch } from './queries';
import { useWatchRecord } from './use-watch-record';
import { watchSchema, type WatchFormValues } from './schema';
import { routes } from '@/config/routes';
import { useSnackbar } from '@/app/providers/SnackbarProvider';
import { ValidationError, toDisplayMessage } from '@/services/api';

const emptyForm: WatchFormValues = {
  name: '', brand: '', slug: '', reference: '', description: '', publicPrice: '',
  condition: '', movement: '', caseMaterial: '', dialColor: '', categoryId: '',
  availability: 'AVAILABLE', visibility: 'PRIVATE', featured: false, images: [],
};

/**
 * Create and edit a watch.
 *
 * One form, two modes. This component owns the data flow — loading, seeding,
 * submitting, guarding against discarded edits; the field groups themselves
 * live in `WatchFormFields.tsx`.
 *
 */
export function WatchFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { notifySuccess } = useSnackbar();

  const createWatch = useCreateWatch();
  const updateWatch = useUpdateWatch();
  // Assembling a watch's fields takes two endpoints; `useWatchRecord` owns that
  // and reports when part of the record could not be loaded at all.
  const record = useWatchRecord(id);

  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const {
    register, handleSubmit, control, reset, watch, setValue, getValues,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<WatchFormValues>({ resolver: zodResolver(watchSchema), defaultValues: emptyForm });

  // `reset` rather than per-field `setValue`, so the form's dirty baseline
  // becomes the loaded record — otherwise the unsaved-changes guard would fire
  // the moment the data arrived.
  const { seed } = record;
  useEffect(() => {
    if (seed) reset(seed);
  }, [seed, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const parsed = watchSchema.parse(values);

    try {
      if (isEdit && id) {
        // `slug` is omitted on update on purpose: the storefront's URLs are
        // built from it, and changing it silently breaks every existing link.
        const { slug: _slug, ...updatable } = parsed;
        await updateWatch.mutateAsync({ id, input: updatable });
        notifySuccess(`${parsed.name} saved.`);
      } else {
        await createWatch.mutateAsync(parsed);
        notifySuccess(`${parsed.name} added to the catalogue.`);
      }
      // Clear the dirty baseline before navigating, so the guard does not fire
      // on a successful save.
      reset(values);
      void navigate(routes.watches);
    } catch (error) {
      // A 409 on the unique slug index is the failure an operator will actually
      // hit, and the API's message names it clearly enough to show as-is.
      setFormError(error instanceof ValidationError ? error.details.join(' ') : toDisplayMessage(error));
    }
  });

  const leave = () => {
    if (isDirty) setConfirmDiscard(true);
    else void navigate(routes.watches);
  };

  if (isEdit && record.isListError) {
    return (
      <PageBody>
        <Paper variant="outlined">
          <ErrorState error={record.listError} onRetry={record.refetchList} title="Could not load this watch" />
        </Paper>
      </PageBody>
    );
  }

  if (isEdit && record.isListSuccess && !record.existing) {
    return (
      <PageBody>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle2">That watch no longer exists</Typography>
          <Typography variant="body2" color="ink.muted" sx={{ mt: 0.5, mb: 2 }}>
            It may have been removed from the catalogue.
          </Typography>
          <Button variant="outlined" onClick={() => void navigate(routes.watches)}>
            Back to watches
          </Button>
        </Paper>
      </PageBody>
    );
  }

  // Rendering the real form here would show blank, editable fields that get
  // silently overwritten the moment the record arrives and `reset()` runs.
  if (record.isSeeding) {
    return (
      <PageBody>
        <Stack spacing={2.5} sx={{ maxWidth: 720 }} aria-busy="true" aria-label="Loading this watch">
          {[3, 2, 4].map((rows, section) => (
            <Box key={section}>
              <Skeleton width={140} height={14} sx={{ mb: 1.5 }} />
              {Array.from({ length: rows }, (_, row) => (
                <Skeleton key={row} height={38} sx={{ mb: 1 }} />
              ))}
            </Box>
          ))}
        </Stack>
      </PageBody>
    );
  }

  const busy = isSubmitting || createWatch.isPending || updateWatch.isPending;
  const fields = { register, control, errors };

  return (
    <PageBody>
      <Box component="form" onSubmit={(event) => void onSubmit(event)} noValidate sx={{ maxWidth: 720 }}>
        {formError && (
          <Alert severity="error" role="alert" sx={{ mb: 2 }} onClose={() => setFormError(null)}>
            {formError}
          </Alert>
        )}

        {record.detailUnavailable && (
          <Alert severity="info" sx={{ mb: 2 }}>
            This watch is unpublished, and the API only exposes descriptions and specifications for published
            watches. Those fields are shown blank below — leaving them blank keeps whatever is currently stored;
            typing in one replaces it.
          </Alert>
        )}

        <BasicInformationFields
          {...fields}
          isEdit={isEdit}
          brandValue={watch('brand')}
          nameValue={watch('name')}
          setValue={setValue}
        />
        <PricingFields {...fields} />
        <SpecificationFields {...fields} />
        <ImageFields {...fields} setValue={setValue} />
        <ClassificationFields
          control={control}
          categories={record.categories}
          categoriesFailed={record.categoriesFailed}
          categoriesLoading={record.categoriesLoading}
        />
        <AvailabilityFields control={control} />

        <Stack direction="row" spacing={1} sx={{ mt: 3, pb: 2 }}>
          <Button type="submit" variant="contained" disabled={busy}>
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add watch'}
          </Button>
          <Button variant="text" onClick={leave} disabled={busy}>
            Cancel
          </Button>
        </Stack>
      </Box>

      <ConfirmDialog
        open={confirmDiscard}
        title="Discard your changes?"
        description={`Your edits to ${getValues('name') || 'this watch'} have not been saved and will be lost.`}
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => void navigate(routes.watches)}
      />
    </PageBody>
  );
}
