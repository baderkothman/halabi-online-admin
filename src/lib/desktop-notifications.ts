import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { isDesktopApp } from './updater';

/**
 * Operating-system notifications, desktop app only. In a plain browser (dev
 * server) this is a no-op. Permission is asked for the first time a
 * notification is actually needed, never at launch.
 */
export async function showDesktopNotification(title: string, body: string): Promise<boolean> {
  if (!isDesktopApp()) return false;
  try {
    let granted = await isPermissionGranted();
    if (!granted) granted = (await requestPermission()) === 'granted';
    if (!granted) return false;
    sendNotification({ title, body });
    return true;
  } catch {
    return false;
  }
}
