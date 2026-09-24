# The Tauri shell

## What the shell is for

Three things, and nothing else:

1. **A real desktop window** — fixed chrome, its own scroll regions, a sensible
   minimum size.
2. **Secure credential storage** — the OS keychain, which a browser cannot
   reach. This is the one place being a desktop app buys real security.
3. **External links** — opening WhatsApp, a mail client, or the dialler through
   an allowlisted, OS-level handler.

Everything else is TypeScript. No business logic lives in Rust, because none of
it would gain anything by being there.

## Commands

`src-tauri/src/keychain.rs` exposes exactly three:

| Command | Behaviour |
| --- | --- |
| `store_session` | Writes the session JSON, overwriting any existing entry |
| `load_session` | Returns the session, or `None` — a missing entry is the normal signed-out case and must not read as an error |
| `clear_session` | Idempotent; deleting a non-existent entry succeeds, so signing out can never strand a user |

Entries are namespaced `com.halabionline.admin` / `session.v1`, so a future
token format cannot collide with one an older build wrote.

The TypeScript side is `lib/session-storage.ts`, the only module that calls
these. It validates the shape of anything it reads back, including refusing to
restore a non-`ADMIN` session.

## Plugins

One: `tauri-plugin-opener`, narrowed by capability to `wa.me`,
`api.whatsapp.com`, `mailto:` and `tel:`. See
[SECURITY.md](SECURITY.md#capabilities).

## Configuration

`tauri.conf.json` sets the window (1440×900, minimum 1024×680, centred), the
CSP, and `withGlobalTauri: false` — the API is reached through the typed
`@tauri-apps/api` import, not a global the page could pick up.

Dev runs against `http://localhost:1420`, which `vite.config.ts` fixes with
`strictPort`. The API's `ADMIN_ORIGIN` names the same origin; silently moving to
1421 would break CORS in a way that looks like an authentication bug.

## Running and building

```bash
bun run desktop          # dev window with hot reload
bun run desktop:build    # production bundle
```

Release builds are size-tuned in `Cargo.toml`: LTO, one codegen unit, `opt-level
= "s"`, symbols stripped.

## Verifying native behaviour

The keychain and the opener **do not work** under `bun run dev` or in Vitest —
there is no `invoke`. Both degrade honestly: persistence becomes a no-op and the
login screen says the session will not be remembered. A browser session proves
nothing about either; test them in the Tauri window.
