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
opens straight into the inbox.

Below the queue, insights computed from the inquiry and watch lists the app
already loads (no extra endpoints, nothing estimated):

- **Inquiries, last 30 days**: one bar per day with the total and the change
  against the previous 30 days. Values are also exposed as a hidden table for
  screen readers.
- **Pipeline**: open inquiries per stage, and the share of resolved inquiries
  (converted or closed) that became a sale.
- **Most inquired watches**: the five pieces with the most inquiries.
- **Needs attention**: pieces still for sale that are available but not
  published, have no photos, or have no price, each linking to its form.

## Watches

Two layouts of the same catalogue, switched from the page header and remembered
on this computer:

- **Grid** (default): photo-led cards, 4:3 cover image, brand, model,
  reference and price, with availability, publish and feature controls on the
  card. The photo or title opens the form. 24 per page.
- **Table**: the dense view of the piece, reference, price, availability,
  storefront visibility, featured and date added. 25 per page.

Both share the filters, sorting, pagination and the same inline controls.

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

**Read on open.** Opening an inquiry marks the customer's messages read and
moves a New inquiry to Viewed (`POST /admin/inquiries/:id/read`). The list dot,
the Unread count, the dashboard's New figure and the sidebar badge update
immediately from the cache, before the request returns; a failure refetches
to restore the server's view.

### Contact actions

The workflow this replaces is an administrator highlighting a phone number and
pasting it into WhatsApp, dozens of times a day. Instead:

- **WhatsApp** opens a composer prefilled from the WhatsApp opening template
  (customer and piece filled in). Disabled with an explanation when the number
  cannot form a valid link.
- **Email** opens the mail client with the email subject and message templates.
- **Call** opens the dialler.

Nothing is ever sent automatically. Each opens a composer; the administrator
sends it.

### Replies

Written in the pane and posted to the API, which stores the message, moves the
inquiry to In discussion, writes a notification for registered customers, and
queues an email or WhatsApp notification for the customer's preferred channel.
Sending is asynchronous, so the reply is saved first and delivery is shown
afterwards under **Notification delivery** (below). The UI never claims the
customer was notified, only that the notification is being sent.

### Notification delivery

Each inquiry lists its external notifications (staff alert on a new inquiry,
customer reply) with the channel, a masked recipient and a status: Queued,
Sending, Sent to provider, Delivered, Failed or Outcome unknown. "Sent to
provider" means the provider accepted it, not that it arrived; email becomes
Delivered when the provider confirms. Failures show the reason and a **Retry**
button. Retry is offered only for definite failures; an "Outcome unknown"
WhatsApp send may already have gone out, so it is never resent from the UI and
needs manual follow-up. While anything is still sending, the detail refreshes
itself every few seconds and stops once it settles.

`Cmd/Ctrl + Enter` sends. Plain Enter does not, deliberately.

**Quick replies** in the reply box insert a saved answer, with the customer and
watch filled in, after anything already written. They are managed in
Settings → Templates.

## New inquiry alerts

The dashboard summary refreshes every 30 seconds. When the number of new
inquiries rises (not on launch, and not when one is read), a notice appears
with an **Open inbox** action, and the sidebar badge updates. If the window is
in the background and desktop notifications are on, an operating-system
notification is shown too (Tauri notification plugin; permission is asked the
first time one is needed).

## Settings

Device-local preferences, grouped into sections addressable by URL
(`/settings/templates`):

- **General**: collapse the sidebar (also toggled from the top bar; remembered).
- **Notifications**: desktop notifications on or off, and a test button.
- **Templates**: the WhatsApp opening, email subject and email message, and up
  to 30 quick replies. Placeholders: `{customerName}`, `{watch}`,
  `{watchBrand}`, `{watchName}`. Unknown placeholders are flagged and left
  visible rather than silently removed. Edits are saved explicitly, with
  discard and restore-defaults.
- **About**: version and how updates arrive.

The API has no settings resource, so these are stored in this installation's
WebView storage and validated on read; anything missing or malformed falls back
to its default.

### Lifecycle

`NEW → VIEWED → CONTACTED → WAITING_FOR_CUSTOMER → IN_DISCUSSION → CLOSED |
CONVERTED`, with the offered next steps defined in
`config/inquiry-status.ts`. Closing or converting is confirmed. Every change
persists to the backend; there is no frontend-only state.

Marking an inquiry converted says explicitly that the watch must be marked sold
separately — the API has no endpoint that does both, and the client does not
pretend to a transaction it cannot make.

## Not built

Categories, customers, sales, finance and testimonials. Most have
database tables; none has a REST endpoint. Each is specified as a backend
requirement in [API-INTEGRATION.md](API-INTEGRATION.md#backend-requirements).

Recording a sale is the most consequential of these — it is the final step of
the business's core workflow, and it needs a transactional endpoint that creates
the sale, marks the watch sold and converts the inquiry together.
