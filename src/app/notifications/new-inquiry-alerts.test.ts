import { describe, expect, it } from 'vitest';
import { arrivalMessage, newArrivals } from './new-inquiry-alerts';

describe('newArrivals', () => {
  it('does not announce what was already waiting when the app opened', () => {
    expect(newArrivals(null, 5)).toBe(0);
  });

  it('announces only increases', () => {
    expect(newArrivals(2, 3)).toBe(1);
    expect(newArrivals(2, 5)).toBe(3);
    expect(newArrivals(3, 2)).toBe(0);
    expect(newArrivals(3, 3)).toBe(0);
    expect(newArrivals(3, undefined)).toBe(0);
  });
});

describe('arrivalMessage', () => {
  it('uses singular and plural wording', () => {
    expect(arrivalMessage(1).title).toBe('New inquiry');
    expect(arrivalMessage(3).title).toBe('3 new inquiries');
  });
});
