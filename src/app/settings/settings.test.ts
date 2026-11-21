import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, DEFAULT_TEMPLATES, getSettings, parseSettings, resetSettingsCacheForTests, updateSettings } from './settings';

describe('parseSettings', () => {
  it('returns the defaults for empty or non-object input', () => {
    expect(parseSettings({})).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('garbage')).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid fields and replaces only the malformed ones', () => {
    const parsed = parseSettings({
      sidebarCollapsed: true,
      desktopNotifications: 'yes',
      templates: { emailSubject: 'About {watch}', quickReplies: [{ id: 'x', title: '', body: 'no title' }] },
    });
    expect(parsed.sidebarCollapsed).toBe(true);
    expect(parsed.desktopNotifications).toBe(DEFAULT_SETTINGS.desktopNotifications);
    expect(parsed.templates.emailSubject).toBe('About {watch}');
    expect(parsed.templates.whatsappOpening).toBe(DEFAULT_TEMPLATES.whatsappOpening);
    expect(parsed.templates.quickReplies).toEqual(DEFAULT_TEMPLATES.quickReplies);
  });
});

describe('settings store', () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetSettingsCacheForTests();
  });

  it('persists a change and reads it back after a restart', () => {
    updateSettings((settings) => ({ ...settings, sidebarCollapsed: true }));
    resetSettingsCacheForTests();
    expect(getSettings().sidebarCollapsed).toBe(true);
  });

  it('falls back to defaults when storage holds invalid JSON', () => {
    window.localStorage.setItem('halabi-admin.settings.v1', '{not json');
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('rejects an invalid change instead of storing it', () => {
    expect(() =>
      updateSettings((settings) => ({ ...settings, templates: { ...settings.templates, quickReplies: [{ id: 'a', title: '', body: '' }] } })),
    ).toThrow();
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
