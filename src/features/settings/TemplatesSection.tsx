import { useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Panel } from '@/components/common/Panel';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useSnackbar } from '@/app/providers/SnackbarProvider';
import { DEFAULT_TEMPLATES, updateSettings, useSettings, type MessageTemplates } from '@/app/settings/settings';
import { TEMPLATE_VARIABLES, renderTemplate, unknownPlaceholders } from '@/lib/templates';

/** A realistic inquiry for the preview, so an author sees exactly what a customer receives. */
const SAMPLE = { customerName: 'Maya Haddad', watchBrand: 'Omega', watchName: 'Seamaster 300' };

const LIMITS = { opening: 2000, subject: 200, body: 4000, title: 60 } as const;

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `reply-${Date.now()}`;
}

/** Field with a live preview and a warning for placeholders that will not be filled. */
function TemplateField({
  label, value, onChange, maxLength, multiline = false, helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  multiline?: boolean;
  helper?: string;
}) {
  const unknown = unknownPlaceholders(value);
  return (
    <Box>
      <TextField
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, maxLength))}
        multiline={multiline}
        minRows={multiline ? 3 : undefined}
        fullWidth
        error={unknown.length > 0}
        helperText={
          unknown.length > 0
            ? `Not filled in automatically: ${unknown.map((name) => `{${name}}`).join(', ')}`
            : helper
        }
      />
      {value.trim() && (
        <Typography variant="caption" color="ink.muted" component="p" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
          Preview: {renderTemplate(value, SAMPLE)}
        </Typography>
      )}
    </Box>
  );
}

/**
 * Settings → Templates.
 *
 * Edits a draft and saves explicitly, so a half-edited template is never what
 * the next WhatsApp or email composer opens with. Templates are stored on this
 * device only (the API has no settings resource).
 */
export function TemplatesSection() {
  const saved = useSettings().templates;
  const [draft, setDraft] = useState<MessageTemplates>(saved);
  const [confirmReset, setConfirmReset] = useState(false);
  const { notifySuccess } = useSnackbar();

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  const incompleteReply = draft.quickReplies.some((reply) => !reply.title.trim() || !reply.body.trim());

  const set = <K extends keyof MessageTemplates>(key: K, value: MessageTemplates[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const setReply = (id: string, change: Partial<{ title: string; body: string }>) =>
    set('quickReplies', draft.quickReplies.map((reply) => (reply.id === id ? { ...reply, ...change } : reply)));

  const save = () => {
    updateSettings((settings) => ({
      ...settings,
      templates: {
        ...draft,
        quickReplies: draft.quickReplies.map((reply) => ({ ...reply, title: reply.title.trim(), body: reply.body.trim() })),
      },
    }));
    notifySuccess('Templates saved.');
  };

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="ink.secondary">
        Templates fill in the customer and the watch for you. Use these fields in any template:
      </Typography>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        {TEMPLATE_VARIABLES.map((variable) => (
          <Tooltip key={variable.name} title={variable.description}>
            <Chip size="small" variant="outlined" label={`{${variable.name}}`} />
          </Tooltip>
        ))}
      </Stack>

      <Panel title="Contact openings">
        <Stack spacing={2}>
          <TemplateField
            label="WhatsApp opening message"
            value={draft.whatsappOpening}
            onChange={(value) => set('whatsappOpening', value)}
            maxLength={LIMITS.opening}
            multiline
            helper="Prefilled when you click WhatsApp on an inquiry. You still review and send it."
          />
          <TemplateField
            label="Email subject"
            value={draft.emailSubject}
            onChange={(value) => set('emailSubject', value)}
            maxLength={LIMITS.subject}
          />
          <TemplateField
            label="Email message"
            value={draft.emailBody}
            onChange={(value) => set('emailBody', value)}
            maxLength={LIMITS.body}
            multiline
            helper="Opens in your mail app when you click Email on an inquiry."
          />
        </Stack>
      </Panel>

      <Panel
        title="Quick replies"
        action={
          <Button
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            disabled={draft.quickReplies.length >= 30}
            onClick={() => set('quickReplies', [...draft.quickReplies, { id: newId(), title: '', body: '' }])}
          >
            Add quick reply
          </Button>
        }
      >
        {draft.quickReplies.length === 0 ? (
          <Typography variant="body2" color="ink.muted">
            No quick replies yet. Add the answers you write most often, then insert them from the reply box.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {draft.quickReplies.map((reply, index) => (
              <Stack key={reply.id} direction="row" spacing={1} alignItems="flex-start">
                <Stack spacing={1} sx={{ flex: 1 }}>
                  <TextField
                    label="Name"
                    value={reply.title}
                    onChange={(event) => setReply(reply.id, { title: event.target.value.slice(0, LIMITS.title) })}
                    error={!reply.title.trim()}
                    helperText={reply.title.trim() ? undefined : 'Give it a short name, such as “Arrange a viewing”.'}
                  />
                  <TemplateField
                    label="Message"
                    value={reply.body}
                    onChange={(value) => setReply(reply.id, { body: value })}
                    maxLength={LIMITS.body}
                    multiline
                  />
                </Stack>
                <Tooltip title="Delete quick reply">
                  <IconButton
                    aria-label={`Delete quick reply ${reply.title || index + 1}`}
                    onClick={() => set('quickReplies', draft.quickReplies.filter((item) => item.id !== reply.id))}
                    sx={{ mt: 2.5 }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            ))}
          </Stack>
        )}
      </Panel>

      {incompleteReply && <Alert severity="warning">Every quick reply needs a name and a message before you can save.</Alert>}

      <Stack direction="row" spacing={1} sx={{ position: 'sticky', bottom: 0, py: 1.5, bgcolor: 'background.default' }}>
        <Button variant="contained" onClick={save} disabled={!dirty || incompleteReply}>
          Save templates
        </Button>
        <Button onClick={() => setDraft(saved)} disabled={!dirty}>
          Discard changes
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button color="inherit" onClick={() => setConfirmReset(true)}>
          Restore defaults
        </Button>
      </Stack>

      <ConfirmDialog
        open={confirmReset}
        title="Restore the default templates?"
        description="Your contact openings and quick replies on this computer will be replaced with the built-in versions."
        confirmLabel="Restore defaults"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false);
          setDraft(DEFAULT_TEMPLATES);
          updateSettings((settings) => ({ ...settings, templates: DEFAULT_TEMPLATES }));
          notifySuccess('Default templates restored.');
        }}
      />
    </Stack>
  );
}
