# Backend, identity and persistence

The implementation uses Supabase Auth and normalized PostgreSQL tables behind Next.js server handlers. No market, bank, brokerage or AI API is connected. Instruments and practice prices are fictional fixtures; manual holdings remain user-entered snapshots.

## Configuration

Copy the repository `.env.example` to `apps/web/.env.local` for local Next.js development. Configure the same variables separately for each Vercel environment:

| Variable | Meaning |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Intended Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project publishable key; an anon key may use the fallback variable below. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Legacy fallback, used only if a publishable key is absent. |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for auth email redirects, such as `https://your-domain.example`. |

There is no service-role key in this implementation. The browser-visible publishable/anon key is not an authorization boundary: verified sessions, RLS, SQL grants and command checks are. Never put a service-role or financial-provider secret in a `NEXT_PUBLIC_` variable.

Absent project configuration returns HTTP 503 with a clear message. Unauthenticated workspace access returns 401. Demo mode remains a separate local sample workspace; authentication failures never silently load demo data into a real account.

## Database setup

The migration files are ordered and source-controlled:

1. `supabase/migrations/202609140001_workspace.sql`: normalized tables, constraints, RLS, fictional practice catalog and private serialization/bootstrap functions.
2. `supabase/migrations/202609140002_atomic_commands.sql`: optimistic-version persistence with one owner lock, append-only practice fills and authoritative price/balance checks.

For a local Supabase development stack, run `supabase start` and `supabase db reset` from the repository root after Docker and its required images are available. `supabase db reset` resets the local database: never aim it at real user data. The committed config enables email confirmation and a 12-character minimum password.

For a selected remote project, authenticate the Supabase CLI, link the verified project reference, review pending migration diffs and apply with the Supabase migration workflow. Do not create/select a project from an inferred name or use a different project's credentials. Rehearse changes on staging before production.

No Storage bucket is necessary for the current flow: CSV validation/import happens through bounded transaction commands, and reports export locally. Add private buckets and ownership policies when server-side file retention is actually implemented.

## Normalized storage

Every private table carries `user_id`, referencing the personal workspace. A workspace is owned by one Supabase identity. Shared household membership is deferred.

| Table | Responsibility |
|---|---|
| `wealthwise_workspaces` | Version, display name and preferences; owner is `auth.users.id`. |
| `wealthwise_accounts` | Manual account metadata and explicit opening balances. |
| `wealthwise_transactions` | Signed account entries; transfers use two matched entries. |
| `wealthwise_holdings` | Manual quantities, unit cost/current price and as-of date. |
| `wealthwise_budgets` | Unique category/month budget limits. |
| `wealthwise_goals` | Target, earmarked savings, monthly contribution and target date. |
| `wealthwise_debts` | Manual outstanding principal, rate and remaining term. |
| `wealthwise_watchlist` | Owned links to fixture instruments. |
| `wealthwise_completed_lessons` | Per-user authored lesson completion. |
| `wealthwise_scenarios` | Saved calculator inputs and assumptions. |
| `wealthwise_practice_orders` | Immutable ordered practice fills. |
| `wealthwise_practice_instruments` | Read-only fictional symbol/price catalog. |

Account/transaction foreign keys include `user_id`, so a transaction cannot point to another user's account. Child primary keys are scoped to the user. RLS permits authenticated users to read only their own rows. Anonymous users cannot read private tables or execute bootstrap/save functions. Direct client writes to financial tables are revoked; only the authenticated command RPC can mutate them.

The private serializer accepts a user identifier internally but execution is revoked from API roles. Public bootstrap/save RPCs derive their identity from `auth.uid()` and never accept an owner override. They use an empty search path and fully qualified tables. Workspace bootstrap is idempotent and creates an empty account, not sample financial records.

Amounts are INR integer minor units (`₹1 = 100`), stored as PostgreSQL `bigint`. Holding quantities use six decimal places. Decimal domain arithmetic rounds valuation to integer minor units. Account balances include opening balance once; transfers are excluded from income/expense reporting. Goal earmarks and virtual practice cash do not add to personal net worth. This is a bounded manual-finance workspace, not double-entry accounting or a brokerage ledger.

## Request and transaction flow

`GET /api/workspace` verifies the user with Supabase `getUser()`, invokes `wealthwise_get_workspace()` and validates the returned object against the shared schema. It returns `{ workspace }` with `Cache-Control: private, no-store`.

`POST /api/commands` accepts `{ command, expectedVersion }`. It verifies same-origin requests, JSON content type, a 256KB request ceiling and the shared command schema. The server verifies the user, reads the current workspace and applies the framework-independent domain command. All financial prices and practice calculations are resolved on the server.

`wealthwise_save_workspace(expectedVersion, workspace)` locks the owner's workspace row. A stale version raises SQLSTATE `40001`, mapped to HTTP 409. The RPC checks limits, normalized relationships, transfer pairing and practice rules, updates normalized rows, and advances the version in one database transaction. An error rolls back the entire change, including any new practice fill.

The bounded v1 implementation replaces manual child collections per command rather than applying independent row patches. This keeps atomic cross-domain edits straightforward, with a 10,000-transaction cap. If datasets or write throughput grow, introduce aggregate-specific commands behind the same service boundary; do not remove concurrency or ownership checks to optimize prematurely.

Responses use `{ error: { code, message } }` on failure. The client must refresh on version conflict before retrying and must not automatically replay non-idempotent toggles. A successfully saved command increments the version; retrying its old expected version conflicts instead of duplicating a transfer or trade. If a response is lost, reload to determine whether the operation committed.

## Practice trading guarantees

- Every new account starts with **₹10,00,000 virtual cash** (`100000000` minor units).
- `NOVA`, `CEDAR`, `TERRA`, `MEADOW`, `HARBOR` and `AURUM` are fictional fixed-price instruments. Their SQL fixture prices match the domain catalog.
- A request specifies symbol, side and quantity; the server supplies the fill price. The SQL RPC independently verifies it against its read-only fixture catalog.
- SQL preserves all existing fills and allows at most one new fill per command. A client cannot rewrite history, reduce a price, reset cash, reorder fills or forge a prior fill timestamp.
- The same workspace lock serializes competing commands. SQL computes available cash and owned quantity from saved fills before accepting an order. Overspending, short selling and duplicate order IDs are rejected.
- Fill timestamps come from the database. Practice cash and positions survive refresh and are never mixed with manual accounts.

Current practice supports immediate full market fills only. Pending limit orders, partial fills, order cancellation and variable quote steps need new explicit contracts and reservation accounting before implementation. No transaction is sent to a real exchange.

## Authentication flows

| Route | Behavior |
|---|---|
| `/signup` | Name/email/password with terms acknowledgement, server validation and Supabase email verification. |
| `/login` | Email/password sign in, generic rejected-credentials message. |
| `/recover` | Neutral recovery acknowledgement that does not reveal account existence. |
| `/update-password` | Verified session, new password confirmation, then local sign-out and return to sign-in. |
| `/auth/callback` | PKCE code exchange; redirect target restricted to `/app` or `/update-password`. |
| `/auth/confirm` | Token-hash email verification/recovery; no arbitrary redirect target. |
| `/auth/signout` | Same-origin POST to sign out the current session. |
| `/auth/error` | Expired/used/unavailable link guidance. |

The Next.js proxy refreshes session cookies and verifies claims. Protected API handlers separately verify the current user. Server Actions validate all form values; fields and buttons are disabled when Supabase is not configured. Passwords are never stored by application code or logged.

Configure Supabase Site URL and allowed redirect URLs for the exact local, staging and production origins. Add `/auth/callback`, `/auth/callback?next=/update-password` and `/auth/confirm` paths. Keep email confirmation enabled. The standard PKCE callback expects the originating browser; token-hash confirmation templates below can support opening a link in another browser:

```html
<!-- Confirm signup template -->
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm email</a>
<!-- Recovery template -->
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Reset password</a>
```

Use a verified production email sender/custom SMTP configuration before public onboarding. Supabase's built-in development sender has delivery and recipient limits; a rendered signup page does not prove email delivery works. Verify signup, confirmation, sign-in, recovery, expired links, updated-password sign-in and sign-out in the selected environment before release.

## Verification

Run `pnpm test` and `pnpm typecheck` from the repository root. `apps/web/server/workspace-database.test.ts` executes the real migrations against PGlite PostgreSQL with minimal Supabase auth/role stubs. Tests cover:

- Cross-user reads hidden by RLS, private serializer denial, direct-write denial and anonymous denial.
- Same expected-version competing saves: one winner and one conflict.
- Composite ownership foreign keys and transactional rollback.
- Balanced transfers, immutable practice history, server fixture prices, overspend/oversell rejection.
- A valid fill rolled back when another record fails validation.
- Quantity precision and unique category/month budgets.

PGlite verifies SQL behavior in process; it does not exercise Supabase's network auth, email delivery, hosted PostgREST, real multi-connection concurrency or cloud backups. Run a two-user live smoke test and a real concurrent-save check against staging after migrations and auth configuration are applied. Keep production and preview credentials/data separated, and verify backups/restore before relying on the service for real data.
