import { useSyncExternalStore } from 'react';
import { z } from 'zod';
import { DEFAULT_TEMPLATES } from '@/lib/templates';

export { DEFAULT_TEMPLATES };

/**
 * Device-local preferences for this desktop app.
 *
 * The API has no settings resource, so these live in this installation's
 * WebView storage. Nothing here is sensitive (the session token stays in the OS
 * keychain). Stored data is validated on read: a field that is missing or
 * malformed falls back to its default instead of breaking the app.
 */


const quickReplySchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().trim().min(1).max(60),
  body: z.string().trim().min(1).max(4000),
});
export type QuickReply = z.infer<typeof quickReplySchema>;

const templatesSchema = z.object({
  whatsappOpening: z.string().max(2000),
  emailSubject: z.string().max(200),
  emailBody: z.string().max(4000),
  quickReplies: z.array(quickReplySchema).max(30),
});
export type MessageTemplates = z.infer<typeof templatesSchema>;

const watchesViewSchema = z.enum(['grid', 'table']);
export type WatchesView = z.infer<typeof watchesViewSchema>;

const settingsSchema = z.object({
  sidebarCollapsed: z.boolean(),
  watchesView: watchesViewSchema,
  desktopNotifications: z.boolean(),
  templates: templatesSchema,
});
export type AppSettings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: AppSettings = {
  sidebarCollapsed: false,
  watchesView: 'grid',
  desktopNotifications: true,
  templates: DEFAULT_TEMPLATES,
};

const STORAGE_KEY = 'halabi-admin.settings.v1';

/** Merges stored data over the defaults field by field, keeping only what validates. */
export function parseSettings(raw: unknown): AppSettings {
  const stored = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const storedTemplates = (stored.templates && typeof stored.templates === 'object' ? stored.templates : {}) as Record<string, unknown>;
  const pick = <T>(schema: z.ZodType<T>, value: unknown, fallback: T): T => {
    const result = schema.safeParse(value);
    return result.success ? result.data : fallback;
  };
  return {
    sidebarCollapsed: pick(z.boolean(), stored.sidebarCollapsed, DEFAULT_SETTINGS.sidebarCollapsed),
    watchesView: pick(watchesViewSchema, stored.watchesView, DEFAULT_SETTINGS.watchesView),
    desktopNotifications: pick(z.boolean(), stored.desktopNotifications, DEFAULT_SETTINGS.desktopNotifications),
    templates: {
      whatsappOpening: pick(templatesSchema.shape.whatsappOpening, storedTemplates.whatsappOpening, DEFAULT_TEMPLATES.whatsappOpening),
      emailSubject: pick(templatesSchema.shape.emailSubject, storedTemplates.emailSubject, DEFAULT_TEMPLATES.emailSubject),
      emailBody: pick(templatesSchema.shape.emailBody, storedTemplates.emailBody, DEFAULT_TEMPLATES.emailBody),
      quickReplies: pick(templatesSchema.shape.quickReplies, storedTemplates.quickReplies, DEFAULT_TEMPLATES.quickReplies),
    },
  };
}

function read(): AppSettings {
  try {
    const text = window.localStorage.getItem(STORAGE_KEY);
    return parseSettings(text ? JSON.parse(text) : {});
  } catch {
    return DEFAULT_SETTINGS;
  }
}

let current: AppSettings | null = null;
const listeners = new Set<() => void>();

function snapshot(): AppSettings {
  current ??= read();
  return current;
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      current = read();
      emit();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useSettings(): AppSettings {
  return useSyncExternalStore(subscribe, snapshot, () => DEFAULT_SETTINGS);
}

export function getSettings(): AppSettings {
  return snapshot();
}

/** Applies a change, validates it, persists it and notifies subscribers. */
export function updateSettings(change: (settings: AppSettings) => AppSettings): void {
  const next = settingsSchema.parse(change(snapshot()));
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable; the change still applies for this session.
  }
  emit();
}

/** Test helper: forget the in-memory copy so the next read comes from storage. */
export function resetSettingsCacheForTests(): void {
  current = null;
}
