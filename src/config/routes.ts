/**
 * Every route path in the application, in one place.
 *
 * Feature code links through these constants rather than string literals, so a
 * path change is a single edit and a typo is a type error.
 */
export const routes = {
  login: '/login',
  dashboard: '/dashboard',

  watches: '/watches',
  newWatch: '/watches/new',
  watchDetail: (id: string) => `/watches/${id}`,

  inquiries: '/inquiries',
  inquiry: (id: string) => `/inquiries/${id}`,
} as const;

/** The screen an authenticated administrator lands on. */
export const HOME_ROUTE = routes.dashboard;
