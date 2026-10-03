# Features

## Authentication

Sign in with an administrator account. The session is restored from the OS
keychain at launch — the guard shows a spinner during that read rather than
flashing the login form.

A 401 from anywhere in the application signs the operator out and returns them
to the login screen with "Your session expired", distinct from a failed sign-in.
Being interrupted mid-task preserves the path, so signing back in returns you
where you were.

`POST /auth/login` is shared with the storefront, so a customer account
authenticates successfully. This application refuses it with "This account is
not an administrator account" — clearer than the wall of 403s the API would
otherwise produce.

## Dashboard

Four operational figures and the live inquiry queue.

- **Available** — published *and* open to inquiries, which is what the API
  counts and what the label says
- **New inquiries** — not yet opened; shown in red when non-zero
- **Active discussions** — in discussion or awaiting a customer
- **Sold** — lifetime

The queue lists the six most recently updated inquiries with an unread dot, and
opens straight into the inbox. There are no charts: the API exposes no time
series, and four scalars do not make one.

## Watches

A dense table of the catalogue: the piece, reference, price, availability,
storefront visibility, featured, and date added.

**Search** covers name, brand and reference — reference numbers are how dealers
actually look a piece up. **Filters** cover availability, storefront visibility,
brand (derived from the data) and featured. **Sorting** covers newest, name and
price in both directions; a watch with no price set sorts last in both, because
it is an unknown rather than a zero.

Three changes are inline, because they are made dozens of times a day and a form
would be the wrong shape: availability, storefront visibility, and featured.

### Availability

A state, never a quantity — Halabi Online sells individual pieces, and nothing
in this application expresses a stock count.

Transitions are defined in `config/availability.ts`:

| From | Can move to |
| --- | --- |
| Available | Reserved, Unavailable, Archived |
| Reserved | Available, Sold, Unavailable |
| Sold | — |
| Unavailable | Available, Archived |
| Archived | Available |

Reserved still accepts inquiries: a reservation can fall through, and the
storefront takes the same view. Sold has no exit — reversing a sale is an
accounting correction, not a one-click list action. Marking sold or archived
opens a confirmation that names the consequence.

### The form

Sections rather than one wall of fields: basic information, pricing,
specifications, classification, availability and storefront. A slug can be
suggested from the brand and name on create, and is locked on edit — the
storefront links to the piece by it.

Leaving with unsaved changes asks first.

Image URLs, alt text and a cover-image choice can be added to the watch form.
The database stores the ordered `watch_images` rows; binary upload and storage
management are not part of the desktop client. Free-form specifications remain
out of the form. See [API-INTEGRATION.md](API-INTEGRATION.md#2-watch-images).

## Inquiries

The primary workflow, as a two-pane inbox.

**Left:** the list, scoped to Open by default — the work, not the archive —
with Unread and All alongside, plus search across customer, watch, email and
phone, and a status filter.

**Right:** who asked, about what, the full conversation, and the actions.

### Contact actions

The workflow this replaces is an administrator highlighting a phone number and
pasting it into WhatsApp, dozens of times a day. Instead:

- **WhatsApp** opens a composer prefilled with the customer's name and the
  piece. Disabled with an explanation when the number cannot form a valid link.
- **Email** opens the mail client with a subject and the same opening message.
- **Call** opens the dialler.

Nothing is ever sent automatically. Each opens a composer; the administrator
sends it.

### Replies

Written in the pane and posted to the API, which stores the message, moves the
inquiry to In discussion, writes a notification for registered customers, and
sends the email. The UI says which of those will happen — and says the opposite
when the customer has no email on file.

`Cmd/Ctrl + Enter` sends. Plain Enter does not, deliberately.

### Lifecycle

`NEW → VIEWED → CONTACTED → WAITING_FOR_CUSTOMER → IN_DISCUSSION → CLOSED |
CONVERTED`, with the offered next steps defined in
`config/inquiry-status.ts`. Closing or converting is confirmed. Every change
persists to the backend; there is no frontend-only state.

Marking an inquiry converted says explicitly that the watch must be marked sold
separately — the API has no endpoint that does both, and the client does not
pretend to a transaction it cannot make.

## Not built

Categories, customers, sales, finance, testimonials and settings. Most have
database tables; none has a REST endpoint. Each is specified as a backend
requirement in [API-INTEGRATION.md](API-INTEGRATION.md#backend-requirements).

Recording a sale is the most consequential of these — it is the final step of
the business's core workflow, and it needs a transactional endpoint that creates
the sale, marks the watch sold and converts the inquiry together.
