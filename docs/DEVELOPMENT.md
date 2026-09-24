# Development

## Every day

```bash
bun run desktop     # the real application
bun run test        # watch mode: bun run test:watch
bun run typecheck
```

Use `bun` for everything. `npx` appears in this project only for external agent
tooling that requires it, and is never the application's package manager.

## Conventions

**Strict TypeScript.** `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
and `verbatimModuleSyntax` are on. `any` is not used; the API boundary narrows
through `lib/coerce.ts` instead.

**Imports** use the `@/` alias, never a relative path that climbs.

**Comments** explain *why*. A comment restating the line below it is noise; a
comment recording a constraint — a backend quirk, a decision and its trade-off —
is the reason anyone can safely change this code later.

## Adding a feature

1. Read the endpoint in the API's controller, or its Swagger document at
   `${VITE_API_BASE_URL}/api/docs`. Do not guess a contract.
2. Add the domain type to `types/domain.ts`.
3. Add the service to `services/api/`, normalising the response through
   `lib/coerce.ts`.
4. Add query keys to `services/query-keys.ts`.
5. Add the feature folder with its `queries.ts`, and state the invalidation
   rules in a comment there.
6. Build the UI. Handle all four states: loading, empty, error, success.
7. If the API cannot support part of it, write the gap into
   [API-INTEGRATION.md](API-INTEGRATION.md) — do not ship a control that does
   nothing.

## Adding a navigation item

`app/layouts/navigation.ts`. The sidebar only lists sections with real endpoints
behind them; a menu item leading to a screen that cannot load is worse than no
item.

## Keyboard

| Shortcut | Where | Does |
| --- | --- | --- |
| `Cmd/Ctrl + Enter` | Inquiry reply | Sends |
| `Esc` | Any dialog | Closes, unless an action is in flight |
| `Enter` / `Space` | Inbox list row | Selects |

Plain `Enter` deliberately does **not** send a reply: they run to paragraphs,
and a stray keystroke sending a half-written message to a customer is
unrecoverable.

## Before calling something done

```bash
bun run typecheck && bun run test && bun run build
```

Then exercise it in `bun run desktop`. A browser session does not prove the
keychain or the external-link actions work — see [TAURI.md](TAURI.md).
