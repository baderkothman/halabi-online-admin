import { describe, expect, it } from 'vitest';
import { DEFAULT_TEMPLATES, renderTemplate, unknownPlaceholders } from './templates';

const context = { customerName: 'Maya Haddad', watchBrand: 'Omega', watchName: 'Seamaster 300' };

describe('renderTemplate', () => {
  it('fills every supported placeholder', () => {
    expect(renderTemplate('{customerName} / {watch} / {watchBrand} / {watchName}', context)).toBe(
      'Maya Haddad / Omega Seamaster 300 / Omega / Seamaster 300',
    );
  });

  it('leaves unknown placeholders visible instead of deleting them', () => {
    expect(renderTemplate('Hi {firstName}', context)).toBe('Hi {firstName}');
  });

  it('reproduces the original opening message by default', () => {
    expect(renderTemplate(DEFAULT_TEMPLATES.whatsappOpening, context)).toBe(
      "Hello Maya Haddad,\n\nI'm contacting you from Halabi Online regarding your inquiry about the Omega Seamaster 300.",
    );
  });
});

describe('unknownPlaceholders', () => {
  it('lists each unsupported name once', () => {
    expect(unknownPlaceholders('{price} {watch} {price} {name}')).toEqual(['price', 'name']);
    expect(unknownPlaceholders('Hello {customerName}')).toEqual([]);
  });
});
