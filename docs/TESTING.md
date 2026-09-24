# Testing

Vitest with React Testing Library, in jsdom. `bun run test`.

The suite is proportionate, not exhaustive. It covers the places where a
regression is a real defect — a security-adjacent behaviour, a silent data
corruption, a workflow rule — and skips the places where a test would only
restate the implementation.

## What is covered, and why each earns its place

### The API boundary — `services/api/client.test.ts`

Every failure mode the application can show an administrator originates here. A
401 must tear the session down **exactly once**, and must *not* when the login
request opts out — a wrong password is also a 401, and conflating the two would
replace a field error with a session banner. An unreachable API must become a
`NetworkError` with a readable message, not a raw `TypeError`.

### Response normalisation — `services/api/watches.test.ts`

`pg` returns Postgres `numeric` as a string. Without coercion, `publicPrice` is
`"4200.00"` and every price sort and comparison downstream is wrong while
looking right. Also asserted: a null price stays null rather than becoming zero
(price-on-request and free are different facts), and an unknown enum member
falls back instead of throwing inside a table row.

The `PATCH` test asserts that explicitly-undefined keys are pruned before
sending — the API's SQL is `COALESCE($n, column)` per field, so an omitted key
means "leave alone" and a sent one does not.

### Status mapping — `config/status-mapping.test.ts`

Completeness against both backend enums, because a missing entry produces a
blank chip rather than a crash — the failure mode a type check will not catch.
Also the workflow rules that exist only here: SOLD offers no transition out,
CONVERTED has no next status, and every proposed transition is a real enum
member.

### Contact links — `lib/contact-links.test.ts`

The WhatsApp URL must be exactly what `wa.me` accepts, and a number too short to
dial must be refused rather than opening WhatsApp on an error page — which looks
to the operator like the application failed.

### Authentication — `features/auth/auth-flow.test.tsx`

Route protection, and the three sign-in outcomes: an administrator is admitted,
a valid **customer** account is refused with an explanation, and a wrong
password reports itself as a wrong password rather than an expired session.

## What is not covered

Rendering assertions on tables and forms that would restate the JSX, and the
Tauri commands — the keychain and the opener have no `invoke` in jsdom, so a
test there would assert the mock. Those are verified in the Tauri window.

## For a bug fix

Reproduce it, write the failing test where one is practical, fix the root cause,
then run the suite. A test that only raises the count is worse than none.
