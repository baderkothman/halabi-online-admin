import { Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PageBody } from '@/app/layouts/AdminLayout';
import { HOME_ROUTE } from '@/config/routes';

/** An unrecognised path inside the shell. Rare, but it should not be a blank pane. */
export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <PageBody>
      <Stack spacing={1} alignItems="flex-start" sx={{ pt: 6 }}>
        <Typography variant="h2">That screen does not exist</Typography>
        <Typography variant="body2" color="ink.muted">
          The link may be out of date.
        </Typography>
        <Button variant="outlined" onClick={() => void navigate(HOME_ROUTE)} sx={{ mt: 1 }}>
          Go to the dashboard
        </Button>
      </Stack>
    </PageBody>
  );
}
