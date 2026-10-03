import { Box, Button, Checkbox, FormControlLabel, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Controller, useFieldArray, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from 'react-hook-form';
import type { ReactNode } from 'react';
import type { WatchFormValues } from './schema';
import { suggestSlug } from './schema';
import { WATCH_AVAILABILITY, WATCH_VISIBILITY, type Category } from '@/types/domain';
import { availabilityPresentation, visibilityPresentation } from '@/config/availability';

/**
 * The watch form's field groups.
 *
 * Split out of `WatchFormPage` so the page keeps only its data flow — loading,
 * seeding, submitting — and each group stays readable on its own. They share
 * the same React Hook Form instance, passed down rather than re-created, so
 * validation and dirty tracking remain one source of truth.
 */

export interface FieldGroupProps {
  register: UseFormRegister<WatchFormValues>;
  control: Control<WatchFormValues>;
  errors: FieldErrors<WatchFormValues>;
}

/**
 * A labelled group of fields: a heading and a rule, not a card. Nesting
 * bordered boxes inside a bordered page is the fastest way to make a form look
 * busier than it is.
 */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="overline"
        color="ink.muted"
        component="h2"
        sx={{ display: 'block', mb: 1, pb: 0.75, borderBottom: 1, borderColor: 'line.subtle' }}
      >
        {title}
      </Typography>
      <Stack spacing={1.75}>{children}</Stack>
    </Box>
  );
}

export function BasicInformationFields({
  register, errors, isEdit, brandValue, nameValue, setValue,
}: FieldGroupProps & {
  isEdit: boolean;
  brandValue: string;
  nameValue: string;
  setValue: UseFormSetValue<WatchFormValues>;
}) {
  return (
    <Section title="Basic information">
      <Stack direction="row" spacing={1.5}>
        <TextField {...register('brand')} label="Brand" required error={Boolean(errors.brand)} helperText={errors.brand?.message} />
        <TextField {...register('name')} label="Model name" required error={Boolean(errors.name)} helperText={errors.name?.message} />
      </Stack>

      <TextField
        {...register('slug')}
        label="Storefront URL slug"
        required
        disabled={isEdit}
        error={Boolean(errors.slug)}
        helperText={
          errors.slug?.message ??
          (isEdit
            ? 'The slug cannot be changed — the storefront links to this watch by it.'
            : 'Used in the public web address for this watch.')
        }
        slotProps={{
          input: {
            endAdornment:
              // Offered only on create, and never overwrites an edited slug.
              !isEdit && brandValue && nameValue ? (
                <Button
                  size="small"
                  variant="text"
                  onClick={() =>
                    setValue('slug', suggestSlug(brandValue, nameValue), { shouldDirty: true, shouldValidate: true })
                  }
                  sx={{ flexShrink: 0, fontSize: '0.6875rem' }}
                >
                  Suggest
                </Button>
              ) : null,
          },
        }}
      />

      <TextField {...register('reference')} label="Reference number" error={Boolean(errors.reference)} helperText={errors.reference?.message} />

      <TextField
        {...register('description')}
        label="Description"
        multiline
        minRows={3}
        error={Boolean(errors.description)}
        helperText={errors.description?.message ?? 'Shown on the storefront listing.'}
      />
    </Section>
  );
}

export function PricingFields({ register, errors }: FieldGroupProps) {
  return (
    <Section title="Pricing">
      <TextField
        {...register('publicPrice')}
        label="Public price"
        type="number"
        error={Boolean(errors.publicPrice)}
        helperText={errors.publicPrice?.message ?? 'Leave empty for price on request.'}
        sx={{ maxWidth: 220 }}
        slotProps={{ htmlInput: { min: 0, step: 1 } }}
      />
    </Section>
  );
}

export function SpecificationFields({ register }: FieldGroupProps) {
  return (
    <Section title="Specifications">
      <Stack direction="row" spacing={1.5}>
        <TextField {...register('condition')} label="Condition" />
        <TextField {...register('movement')} label="Movement" />
      </Stack>
      <Stack direction="row" spacing={1.5}>
        <TextField {...register('caseMaterial')} label="Case material" />
        <TextField {...register('dialColor')} label="Dial colour" />
      </Stack>
    </Section>
  );
}

export function ImageFields({ register, control, errors, setValue }: FieldGroupProps & {
  setValue: UseFormSetValue<WatchFormValues>;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: 'images' });

  const markPrimary = (index: number) => {
    fields.forEach((_, fieldIndex) => {
      setValue(`images.${fieldIndex}.isPrimary`, fieldIndex === index, { shouldDirty: true });
    });
  };

  return (
    <Section title="Images">
      <Typography variant="body2" color="ink.muted">
        Add image URLs for the storefront gallery. The cover image appears first on catalogue cards.
      </Typography>

      <Stack spacing={1.25}>
        {fields.map((field, index) => {
          const imageError = errors.images?.[index];
          return (
            <Box
              key={field.id}
              sx={{ p: 1.25, border: 1, borderColor: 'line.subtle', borderRadius: 1, bgcolor: 'surfaceTone.sunken' }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ sm: 'flex-start' }}>
                <TextField
                  {...register(`images.${index}.url`)}
                  label={`Image ${index + 1} URL`}
                  required
                  error={Boolean(imageError?.url)}
                  helperText={imageError?.url?.message}
                  placeholder="https://..."
                  sx={{ flex: 1.35 }}
                />
                <TextField
                  {...register(`images.${index}.alt`)}
                  label="Alt text"
                  error={Boolean(imageError?.alt)}
                  helperText={imageError?.alt?.message ?? 'Optional; defaults to a generic watch description.'}
                  sx={{ flex: 1 }}
                />
                <Controller
                  name={`images.${index}.isPrimary`}
                  control={control}
                  render={({ field: primaryField }) => (
                    <FormControlLabel
                      sx={{ minWidth: 72, mt: { sm: 0.6 } }}
                      control={
                        <Checkbox
                          checked={Boolean(primaryField.value)}
                          onChange={() => markPrimary(index)}
                          inputRef={primaryField.ref}
                        />
                      }
                      label="Cover"
                    />
                  )}
                />
                <IconButton
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Remove image ${index + 1}`}
                  sx={{ mt: { sm: 0.35 }, alignSelf: { xs: 'flex-end', sm: 'center' } }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>
          );
        })}
      </Stack>

      <Button
        type="button"
        variant="outlined"
        startIcon={<AddPhotoAlternateOutlinedIcon />}
        onClick={() => append({ url: '', alt: '', isPrimary: fields.length === 0 })}
        sx={{ alignSelf: 'flex-start' }}
      >
        Add image
      </Button>
    </Section>
  );
}

export function ClassificationFields({
  control, categories, categoriesFailed, categoriesLoading,
}: Pick<FieldGroupProps, 'control'> & {
  categories: Category[];
  categoriesFailed: boolean;
  categoriesLoading: boolean;
}) {
  return (
    <Section title="Classification">
      <Controller
        name="categoryId"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            value={field.value ?? ''}
            select
            label="Category"
            disabled={categoriesLoading || categoriesFailed}
            helperText={categoriesFailed ? 'Categories could not be loaded.' : undefined}
            sx={{ maxWidth: 320 }}
          >
            <MenuItem value="">No category</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
    </Section>
  );
}

export function AvailabilityFields({ control }: Pick<FieldGroupProps, 'control'>) {
  return (
    <Section title="Availability and storefront">
      <Stack direction="row" spacing={1.5}>
        <Controller
          name="availability"
          control={control}
          render={({ field }) => (
            <TextField {...field} select label="Availability" helperText={availabilityPresentation[field.value].description}>
              {WATCH_AVAILABILITY.map((status) => (
                <MenuItem key={status} value={status}>
                  {availabilityPresentation[status].label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="visibility"
          control={control}
          render={({ field }) => (
            <TextField {...field} select label="Storefront" helperText={visibilityPresentation[field.value].description}>
              {WATCH_VISIBILITY.map((value) => (
                <MenuItem key={value} value={value}>
                  {visibilityPresentation[value].label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </Stack>

      <Controller
        name="featured"
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={<Checkbox {...field} checked={field.value} />}
            label={<Typography variant="body2">Feature this piece on the storefront homepage</Typography>}
          />
        )}
      />
    </Section>
  );
}
