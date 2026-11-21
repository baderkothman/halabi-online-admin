/**
 * Decides when a change in the "new inquiries" count is worth announcing.
 *
 * Only an increase after the first successful load counts: opening the app with
 * five waiting inquiries is not five arrivals, and reading one (a decrease) is
 * not an event. Pure so it can be tested without timers or a QueryClient.
 */
export function newArrivals(previous: number | null, next: number | undefined): number {
  if (next === undefined || previous === null) return 0;
  return next > previous ? next - previous : 0;
}

export function arrivalMessage(count: number): { title: string; body: string } {
  return count === 1
    ? { title: 'New inquiry', body: 'A customer sent a new inquiry. Open the inbox to reply.' }
    : { title: `${count} new inquiries`, body: 'Customers sent new inquiries. Open the inbox to reply.' };
}
