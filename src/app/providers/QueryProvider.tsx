import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError, UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from '@/services/api';

/**
 * Creates the query client with defaults tuned for an internal admin tool.
 *
 * Retry policy is the important decision: retrying a 401, 403, 404 or 422 is
 * pointless — the answer will not change — and retrying a 401 three times turns
 * one expired session into three failed requests before the app reacts. Only
 * network, timeout and 5xx failures are worth a second attempt.
 */
function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // An administrator switching between screens should see current data,
        // but not refetch on every window focus while working through a list.
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (
            error instanceof UnauthorizedError ||
            error instanceof ForbiddenError ||
            error instanceof NotFoundError ||
            error instanceof ValidationError
          ) {
            return false;
          }
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
          return failureCount < 2;
        },
      },
      mutations: {
        // A mutation that failed has already had a side effect or not; retrying
        // it automatically risks duplicating a reply or a status change.
        retry: false,
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // `useState` rather than a module constant, so tests get a fresh client per
  // render and cannot leak cache between cases.
  const [client] = useState(createQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
