# Halabi Online Admin

The internal desktop application Halabi Online administrators use to run the
business: the watch catalogue, and the customer inquiries that lead to sales.

It is a **React + TypeScript renderer inside a Tauri shell**, talking to the
NestJS API over REST. It contains no backend code, connects to no database, and
shares no source with the storefront or the API.

```
React + TypeScript (Vite)        ← this repository
        ↓  Tauri shell (Rust)
        ↓  REST over HTTPS
  halabi-online-api (NestJS)     ← separate repository
        ↓
  Neon PostgreSQL                ← never reached from here
```

## Requirements

- [Bun](https://bun.sh) 1.1+ — the only package manager used here
- Rust 1.77+ and a platform toolchain for the Tauri shell
  ([prerequisites](https://tauri.app/start/prerequisites/))
- A running instance of `halabi-online-api`

## Setup

```bash
bun install
cp .env.example .env     # then point VITE_API_BASE_URL at the API
```

The API must allow this application's origin. It reads `ADMIN_ORIGIN` from its
own environment and already defaults to `http://localhost:1420`, which is the
port this app fixes in `vite.config.ts` — those two values must agree or every
request fails CORS in a way that looks like an authentication bug.

## Commands

| Command               | What it does                                          |
| --------------------- | ----------------------------------------------------- |
| `bun run desktop`     | The real application — Tauri window with hot reload    |
| `bun run dev`         | Renderer only, in a browser. No keychain, no `opener`  |
| `bun run desktop:build` | Production desktop bundle                           |
| `bun run build`       | Typecheck and build the renderer                       |
| `bun run typecheck`   | `tsc --noEmit`                                         |
| `bun run test`        | Vitest                                                 |

`bun run dev` is for fast UI work. Two things genuinely do not work there:
session persistence (the OS keychain is a Rust command) and the WhatsApp/email
actions (Tauri's `opener`). Both degrade honestly rather than silently — the
login screen says so. Never conclude a native capability works from a browser.

## What is here, and what is not

Implemented against real, verified API endpoints:

- **Authentication** — sign in, session restore, route guards, expiry handling
- **Dashboard** — four operational counts and the live inquiry queue
- **Watches** — list, search, filter, sort, create, edit, availability,
  storefront visibility, featured
- **Inquiries** — two-pane inbox, conversation, replies, lifecycle, WhatsApp,
  email and phone actions

Deliberately absent, because the API exposes no endpoint for them: watch image
upload, category management, customers, sales, finance, testimonials and
settings. The database has tables for most of these; the REST surface does not.
Each is written up as a backend requirement in
[docs/API-INTEGRATION.md](docs/API-INTEGRATION.md). Nothing in this application
is a button that does not work.

## Documentation

| Document | Covers |
| --- | --- |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Structure, state ownership, layering |
| [API-INTEGRATION.md](docs/API-INTEGRATION.md) | Every endpoint used, and the gaps |
| [DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | Tokens, density, status vocabulary |
| [SECURITY.md](docs/SECURITY.md) | Token storage, Tauri permissions, CSP |
| [TAURI.md](docs/TAURI.md) | The shell, its commands and capabilities |
| [TESTING.md](docs/TESTING.md) | What is tested and why those things |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | Conventions and common tasks |
| [FEATURES.md](docs/FEATURES.md) | The workflows, end to end |
