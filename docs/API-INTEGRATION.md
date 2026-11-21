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
| `GET /api/v1/admin/dashboard/watches` | **No query parameters.** Returns the whole catalogue, ordered by `updated_at DESC`, including image rows for edit forms. |
| `POST /api/v1/admin/dashboard/watches` | `CreateWatchDto`, including optional URL-based `images`. The response projects the saved watch row. |
| `PATCH /api/v1/admin/dashboard/watches/:id` | Same DTO, all fields optional. SQL is `COALESCE($n, column)` per scalar field, so an **omitted** key means "leave alone". When `images` is present, the saved image set is replaced; `images: []` clears it. |
| `GET /api/v1/public/watches/:slug` | The only source of full detail (description, images, category). It filters to `visibility = 'PUBLIC'`, so an unpublished watch has **no** detail source. |
| `GET /api/v1/public/categories` | Read-only; used to populate the category selector. |

`ValidationPipe` runs with `forbidNonWhitelisted: true`, so sending a key the
DTO does not declare is a 400, not a silent ignore.

### Inquiries

| Endpoint | Notes |
| --- | --- |
| `GET /api/v1/admin/inquiries` | Optional `?status=`. No pagination, no search, no date range. |
| `GET /api/v1/admin/inquiries/:id` | Detail with the full message thread and `notificationAttempts` (delivery status of external notifications). |
| `PATCH /api/v1/admin/inquiries/:id/status` | Accepts any `InquiryStatus`. |
| `POST /api/v1/admin/inquiries/:id/read` | Marks the customer's messages read and a `NEW` inquiry `VIEWED`. Idempotent. Called when an inquiry is opened. |
| `POST /api/v1/admin/inquiries/:id/messages` | Has side effects the response does not describe — see below. |
| `POST /api/v1/admin/inquiries/:id/notification-attempts/:attemptId/retry` | Requeues a definitively `FAILED` attempt (202). 404 if unknown, 409 if the attempt is not retryable (accepted, delivered, unknown, queued). |

**`POST .../messages` does three things the response body hides:** it moves the
inquiry to `IN_DISCUSSION`, writes a `notifications` row for a registered
customer, and queues an email or WhatsApp notification that a background
dispatcher sends after the response (its progress appears in
`notificationAttempts`, not in this response). Appending the
returned message to the cache would therefore leave the status, the list
ordering and the sidebar badge stale. Both inquiry mutations invalidate
`inquiries.all` **and** `dashboard.all`.

## Cache invalidation

Rules live with the mutations in each feature's `queries.ts`.

| Mutation | Invalidates | Because |
| --- | --- | --- |
| Create watch | `watches.all`, `dashboard.all` | New row; summary counts move |
| Update watch | `watches.all`, `dashboard.all` | Availability and visibility both feed the summary |
| Update inquiry status | `inquiries.all`, `dashboard.all` | `updated_at` is the list's sort order; the NEW count drives the sidebar badge |
| Reply to inquiry | `inquiries.all`, `dashboard.all` | The backend also changes the status — see above |

Keys are declared once in `src/services/query-keys.ts` and are hierarchical, so
invalidating a prefix reaches every list and detail beneath it.

---

## Backend requirements

These are gaps in the API, not unfinished work here. Each was verified absent by
reading the API's controllers. **The database has tables for most of them** —
`categories`, `sales`, `testimonials` — but no REST surface. Watch images are
the exception: they are now managed by the watch create/update endpoints.

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

### 2. Watch images

`watch_images` is managed by the watch create/update endpoints. The admin form
accepts absolute HTTP(S) image URLs, alt text and a cover-image flag, and the API
stores the ordered rows. This is URL-based image management; backend-owned file
uploads and deletion/reordering endpoints remain a future storage improvement.

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

### 8. Read receipts (implemented)

`POST /admin/inquiries/:id/read` now sets `read_at` on the customer's unread
messages and moves a `NEW` inquiry to `VIEWED`, in one transaction. The admin
app calls it when an inquiry is opened.
