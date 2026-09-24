# Security

## The session token

The JWT lives in the **operating system's credential store** — macOS Keychain,
Windows Credential Manager, Linux Secret Service — reached through the Rust
commands in `src-tauri/src/keychain.rs`. It is never written to `localStorage`,
`sessionStorage`, IndexedDB, or a file.

### Why not an httpOnly cookie

That is the stronger design, and it is not available: the API returns the token
in the login response body and runs CORS with `credentials: false`. There is no
cookie to receive and none the browser would send back. Changing that is a
backend decision; if it is made, only `lib/session-storage.ts` changes here.

### Why not localStorage

Any script running in the WebView can read it. The keychain is encrypted at
rest by the OS and scoped to this application.

### The deliberate absence of a fallback

Running `bun run dev` in a browser, there is no `invoke`, so nothing is
persisted and a reload signs you out. `session-storage.ts` **does not** fall
back to `localStorage` — a convenience fallback in development is exactly how a
token ends up in insecure storage in production. The login screen says plainly
that the session will not be remembered.

## Tauri is not a security boundary

The backend authorises every request from the bearer token. `RequireAuth` is
navigation, not authorization; a token that got past it is still rejected by
`JwtAuthGuard` and `RolesGuard` server-side. The admin-role check in
`services/api/auth.ts` exists so a customer account fails legibly, not because
it protects anything.

## Capabilities

`src-tauri/capabilities/default.json` grants `core:default` and **one** plugin
permission:

```json
{ "identifier": "opener:allow-open-url",
  "allow": [ "https://wa.me/*", "https://api.whatsapp.com/*", "mailto:*", "tel:*" ] }
```

Not granted, and not needed: filesystem, shell, process, HTTP plugin, clipboard,
notification, global shortcut. The application reads and writes no local files,
and all network traffic goes through the WebView's own `fetch`.

Every external URL is assembled in `lib/contact-links.ts` and opened through
that plugin. A URL built anywhere else, or pointing anywhere else, is refused by
the Rust side — the allowlist is enforcement, not documentation.

## Content Security Policy

Set in `src-tauri/tauri.conf.json`. `script-src` is `'self'` only — no inline
script, no CDN. `connect-src` names the API origins. `frame-src` and
`object-src` are `'none'`; `form-action` is `'none'`.

`style-src` includes `'unsafe-inline'`, which Emotion requires to inject
Material UI's styles at runtime. This is a real, if narrow, relaxation: it
permits injected `<style>` content, not script execution, and `script-src`
remains strict.

## Untrusted data

Customer messages, names and contact details are untrusted boundary data. They
are rendered as **text** — React escapes by default and nothing here uses
`dangerouslySetInnerHTML`, which appears nowhere in the codebase. Phone numbers
are stripped to digits before being placed in a URL.

Unknown enum values from the API fall back to a safe member (`toEnum` in
`lib/coerce.ts`) rather than crashing a table row.

## What is never logged

Tokens, passwords, and customer PII. The client logs a failed request's URL and
cause in development only, and never the `Authorization` header. There are no
secrets of any kind in this bundle — no database credentials, no JWT signing
secret, no SMTP or provider keys. `.env` holds one value: the API's base URL.

## Financial data

None is reachable from this application today, because the API exposes no sales
or finance endpoints. When it does: those queries should carry a short
`gcTime`, must not be logged, and the section should be treated as the most
sensitive screen in the product.
