import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '@/app/providers/SnackbarProvider';
import { getSettings } from '@/app/settings/settings';
import { showDesktopNotification } from '@/lib/desktop-notifications';
import { routes } from '@/config/routes';
import { arrivalMessage, newArrivals } from './new-inquiry-alerts';

/**
 * Announces new inquiries as the dashboard summary refreshes: an in-app notice
 * with an "Open inbox" action, plus an OS notification when the window is in
 * the background and desktop notifications are enabled in Settings.
 */
export function useNewInquiryAlerts(newInquiries: number | undefined) {
  const previous = useRef<number | null>(null);
  const { notifyInfo } = useSnackbar();
  const navigate = useNavigate();

  useEffect(() => {
    if (newInquiries === undefined) return;
    const arrived = newArrivals(previous.current, newInquiries);
    previous.current = newInquiries;
    if (arrived === 0) return;

    const { title, body } = arrivalMessage(arrived);
    notifyInfo(title, { label: 'Open inbox', onClick: () => void navigate(routes.inquiries) });
    if (getSettings().desktopNotifications && !document.hasFocus()) void showDesktopNotification(title, body);
  }, [newInquiries, notifyInfo, navigate]);
}
