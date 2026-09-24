import {
  Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
} from '@mui/material';

/**
 * Confirmation for an action with a consequence.
 *
 * `description` must state what will actually happen — "This removes the watch
 * from the storefront immediately" — not "Are you sure?". A confirmation that
 * carries no information trains people to click through it.
 */
export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button as destructive. */
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  destructive = false, busy = false, onConfirm, onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      // Escape and backdrop close, except while the action is in flight —
      // dismissing then would leave the operator unsure whether it ran.
      onClose={busy ? undefined : onCancel}
      maxWidth="xs"
      fullWidth
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description" variant="body2" color="ink.secondary">
          {description}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={busy} color="inherit">
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={busy}
          variant="contained"
          color={destructive ? 'error' : 'primary'}
          // Autofocus on the confirm button would make Enter destructive; the
          // dialog opens with focus on the cancel path instead.
        >
          {busy ? 'Working…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
