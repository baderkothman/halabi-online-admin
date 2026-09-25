# API integration

The NestJS API is the contract. Its Swagger document is served at
`${VITE_API_BASE_URL}/api/docs` and is the source of truth; the types in
`src/types/domain.ts` are written from it and are independent of it. No backend
source is imported here, and no endpoint in this document was assumed — each was
read from the API's controllers before being used.

## Conventions

Every response is wrapped in `{ data }`, and paginated ones add `{ meta }`.
`src/services/api/client.ts` unwraps both and is the only module that calls
`fetch`.

Errors are normalised into typed classes (`ValidationError`, `UnauthorizedError`,
…) in `src/services/api/errors.ts`. Feature code branches on the class, never on
a status code, and never shows a raw backend message it has not vetted.

### Numbers arrive as strings

The API queries Postgres through `pg`, which returns `numeric` columns and
`count(*)` aggregates as **strings**. `publicPrice` arrives as `"4200.00"` and
`unreadCount` as `"3"`. Every service normalises through `src/lib/coerce.ts`, so
the domain types are literally true by the time a component sees them. This is
not defensive habit — without it, price sorting and unread badges are wrong.

## Endpoints in use

### Authentication

| Endpoint | Notes |
| --- | --- |
| `POST /api/v1/auth/login` | Shared with the storefront. Returns `{ accessToken, user }`; the JWT lasts 7 days by the API's `JWT_EXPIRES_IN` default. |

There is **no logout endpoint** — the API issues stateless JWTs and holds no
server-side session. Signing out discards the token locally.

Because login is shared, it authenticates customers too. `services/api/auth.ts`
rejects a non-`ADMIN` role with a clear message. That is usability, not
security: `RolesGuard` rejects the same token at every admin endpoint anyway.

### Dashboard

| Endpoint | Notes |
| --- | --- |
| `GET /api/v1/admin/dashboard/summary` | Four counts in one query. `available` counts watches that are `AVAILABLE` **and** `PUBLIC` — the business-meaningful figure, which is why the dashboard labels it "published and open to inquiries". |

### Watches

| Endpoint | Notes |
| --- | --- |
| `GET /api/v1/admin/dashboard/watches` | **No query parameters.** Returns the whole catalogue, ordered by `updated_at DESC`. |
| `POST /api/v1/admin/dashboard/watches` | `CreateWatchDto`. Response projects only five columns. |
| `PATCH /api/v1/admin/dashboard/watches/:id` | Same DTO, all fields optional. SQL is `COALESCE($n, column)` per field, so an **omitted** key means "leave alone" — the client prunes `undefined` keys before sending rather than passing them through. |
| `GET /api/v1/public/watches/:slug` | The only source of full detail (description, images, category). It filters to `visibility = 'PUBLIC'`, so an unpublished watch has **no** detail source. |
| `GET /api/v1/public/categories` | Read-only; used to populate the category selector. |

`ValidationPipe` runs with `forbidNonWhitelisted: true`, so sending a key the
DTO does not declare is a 400, not a silent ignore.

### AI photo studio

| Endpoint | Notes |
| --- | --- |
| `POST /api/v1/admin/dashboard/photo-jobs` | Upload + queue. JSON with a **base64** payload, not multipart — the API has no upload route and no object storage. Answers **202** with a job that has barely started. |
| `GET /api/v1/admin/dashboard/photo-jobs/:id` | Polled every 2 s while the job is running; polling stops at a terminal status. |
| `GET /api/v1/admin/dashboard/photo-jobs?watchId=` | A watch's job history, and how a job still running when the screen opens is picked back up. |
| `GET /api/v1/media/:id` | Public image bytes, immutable. Both the source photo and the result are served from here. |

The generation runs in an n8n workflow against OpenAI and reports its progress
to the API over its own authenticated callbacks — so `progress` and `stage` are
facts from the workflow, never something this client interpolates. An approved
result is written into `watch_images` **by the API**; a rejected one
(`NEEDS_REVIEW`) is kept on the job and deliberately not filed. See
`automation/README.md`.

### Inquiries

| Endpoint | Notes |
| --- | --- |
| `GET /api/v1/admin/inquiries` | Optional `?status=`. No pagination, no search, no date range. |
| `GET /api/v1/admin/inquiries/:id` | Detail with the full message thread. |
| `PATCH /api/v1/admin/inquiries/:id/status` | Accepts any `InquiryStatus`. |
| `POST /api/v1/admin/inquiries/:id/messages` | Has side effects the response does not describe — see below. |

**`POST .../messages` does three things the response body hides:** it moves the
inquiry to `IN_DISCUSSION`, writes a `notifications` row for a registered
customer, and sends an email through the API's `EmailService`. Appending the
returned message to the cache would therefore leave the status, the list
ordering and the sidebar badge stale. Both inquiry mutations invalidate
`inquiries.all` **and** `dashboard.all`.

## Cache invalidation

Rules live with the mutations in each feature's `queries.ts`.

| Mutation | Invalidates | Because |
| --- | --- | --- |
| Create watch | `watches.all`, `dashboard.all` | New row; summary counts move |
| Update watch | `watches.all`, `dashboard.all` | Availability and visibility both feed the summary |
| Create photo job | `photoJobs.all` | A new job joins the watch's history; the detail cache is seeded from the 202 response |
| Photo job reaches `SUCCEEDED` | `watches.all` | The API filed a new row into `watch_images`, so the watch's detail is stale |
| Update inquiry status | `inquiries.all`, `dashboard.all` | `updated_at` is the list's sort order; the NEW count drives the sidebar badge |
| Reply to inquiry | `inquiries.all`, `dashboard.all` | The backend also changes the status — see above |

Keys are declared once in `src/services/query-keys.ts` and are hierarchical, so
invalidating a prefix reaches every list and detail beneath it.

---

## Backend requirements

These are gaps in the API, not unfinished work here. Each was verified absent by
reading the API's controllers. **The database has tables for most of them** —
`watch_images`, `categories`, `sales`, `testimonials` — but no REST surface.

### 1. Server-side filtering for the admin lists — *highest priority*

Both admin list endpoints return everything. Filtering, searching, sorting and
paging are done in the browser (`use-watch-filters.ts`, `InquiriesPage.tsx`).

That is sound at a single dealer's scale — hundreds of rows sort in well under a
frame — and unsound in the low thousands. Needed on
`GET /admin/dashboard/watches` and `GET /admin/inquiries`:

```
search, page, limit, sort, status, availability, visibility,
category, brand, dateFrom, dateTo
```

When they arrive, the two client-side hooks are replaced by query parameters and
nothing else in either feature changes.

### 2. Watch image management

`watch_images` now has exactly **one** writer: an approved AI photo job, which
appends a row and makes it primary only when the watch has none. That covers
getting a photograph onto a watch; it does not cover managing the gallery.
Still needed:

```
POST   /admin/watches/:id/images      (a plain upload, for photographs that
                                       should not go through generation)
DELETE /admin/watches/:id/images/:imageId
PATCH  /admin/watches/:id/images/order
PATCH  /admin/watches/:id/images/:imageId/primary
```

Until these exist, an image cannot be removed, reordered or re-designated from
this application, and the studio panel says nothing it cannot do. The desktop
client must never become image storage; it uploads and the backend owns the
files.

### 3. An admin watch-detail endpoint

Full detail is only reachable through the **public** `/public/watches/:slug`,
which filters to `PUBLIC`. An unpublished watch cannot be fully read by the
administrator who owns it. The edit form works from the list projection as a
result, which is why `description` and the specification fields cannot be
pre-filled on edit. Needed: `GET /admin/watches/:id` returning every column.

### 4. Category management

`categories` has `display_order` and `is_active` columns that nothing exposes.
Needed: `POST`, `PATCH`, `DELETE /admin/categories`, plus reordering. Deleting a
category with watches attached must be rejected by the API — the column is
`ON DELETE SET NULL`, which silently orphans them today.

### 5. Sales and finance

The `sales` table exists with `purchase_cost`, `sale_price`, `additional_costs`
and `sold_at`, and **no endpoint reads or writes it**. Recording a sale is the
final step of the business's core workflow, so this is the largest functional
gap after images. Needed:

```
POST /admin/sales          record a sale against a watch and customer
GET  /admin/sales          history
GET  /admin/sales/:id
GET  /admin/finance/summary?period=   revenue, cost, profit, average sale
```

Recording a sale should be transactional on the backend: create the sale, set
the watch `SOLD`, and set the originating inquiry `CONVERTED` together. The
client must not simulate that consistency across three separate calls — today it
cannot record a sale at all, and the two status changes are made independently
and deliberately, with the inquiry confirmation saying so.

### 6. Customers

No customer endpoint exists. Worth noting precisely: `GET /admin/inquiries`
returns `customer_name`, `email` and `phone` but **not** `customer_id`, so this
application cannot even distinguish a registered customer from a guest, let
alone list customers or show one person's history. Needed:
`GET /admin/customers`, `GET /admin/customers/:id`, and `customerId` added to
the inquiry projections.

### 7. Testimonials and settings

`testimonials` exists in the schema with `display_status` and `display_order`,
and has no endpoint. There is no settings resource of any kind. Both are
straightforward CRUD once the API exposes them.

### 8. Read receipts

`inquiry_messages.read_at` is selected and drives the unread badge, but nothing
sets it — so a message is unread forever. Needed:
`POST /admin/inquiries/:id/read`, marking customer messages read when an
administrator opens the thread.
