# Architecture

## Shape

```
src/
├── app/            Shell: providers, router, layouts, error boundary
├── features/       One folder per business capability — the bulk of the code
├── components/     Shared UI, promoted here only once genuinely reused
├── services/api/   The only modules that touch the network
├── config/         Routes, navigation, and the status vocabularies
├── theme/          Design tokens and Material UI component defaults
├── types/          Frontend domain types, written from the API contract
└── lib/            Small pure helpers: coercion, formatting, contact links
```

Features own their own queries, schemas and components. A component moves into
`components/` when a second feature actually needs it, never in anticipation.

## Layers

```
Component
   ↓ calls a hook from the feature's queries.ts
TanStack Query
   ↓ calls a function from services/api/*
API service          normalises the response into a domain type
   ↓
services/api/client  the only fetch() in the application
```

Nothing skips a layer. A component never calls `fetch`, never parses a
response, and never sees a status code.

## State ownership

| Kind of state | Lives in | Why |
| --- | --- | --- |
| Server data | TanStack Query | The cache *is* the copy. Nothing is mirrored into `useState`, so nothing can go stale independently. |
| Form state | React Hook Form | Uncontrolled inputs, validated by Zod at the boundary. |
| Local UI state | `useState` in the component | Selected row, open menu, collapsed sidebar. |
| Session | `AuthProvider` + the OS keychain | One context, one storage module. |
| Transient feedback | `SnackbarProvider` | One snackbar, one queue. |

There is no Redux and no global store. Server state is genuinely server state;
everything else is local enough to belong where it is used.

## The three decisions worth knowing

### 1. The API client holds the token, not React

`setAuthToken` pushes the JWT into a module variable in `client.ts`. Requests
fire from places with no component context — a query retry, a background
refetch — and threading a token through each would mean every caller could
forget. The client also owns the 401 response: it calls a handler the auth
provider registers once, which tears the session down from anywhere.

### 2. Status vocabulary is centralised, not scattered

`config/availability.ts` and `config/inquiry-status.ts` are the only places a
status enum is given a label, a colour, a description, a set of legal
transitions, or a confirmation requirement. A component asks
`getAvailability(status)` and renders what it gets. Nothing in the UI compares
against a raw enum string, which is what keeps a new backend enum member from
producing five inconsistent treatments across five screens.

Both files also encode **workflow**, not just presentation: `allowedTransitions`
is why the UI will not offer to un-sell a watch, and `requiresConfirmation` is
why marking one sold opens a dialog that names the consequence.

### 3. Filtering is client-side, and that is the API's constraint

Neither admin list endpoint accepts filter parameters — see
[API-INTEGRATION.md](API-INTEGRATION.md#1-server-side-filtering-for-the-admin-lists--highest-priority).
The lists are fetched whole and narrowed in `use-watch-filters.ts` and
`InquiriesPage.tsx`. This is correct at a single dealer's scale and wrong in the
low thousands; both hooks are written so that adopting server parameters
replaces them without touching the surrounding feature.

## Error handling

Three levels, each catching what the one below cannot:

1. **The API client** turns every network and HTTP failure into a typed
   `ApiError` whose message is already safe to display.
2. **Query and mutation callers** render `ErrorState` or raise a snackbar.
3. **`AppErrorBoundary`** catches render-time crashes, keyed on the route so
   navigating away recovers.

A raw backend exception or stack trace never reaches an administrator.
