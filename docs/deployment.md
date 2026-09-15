# Deployment and operations

The Next.js website and demo can run on Vercel without a backend. Personal accounts require a configured Supabase project, applied migrations and working confirmation/recovery email. A successful web build alone does not verify those services.

## Deployment targets

| Setting | Target |
| --- | --- |
| GitHub repository | `sudo-anshul/wealth-wise` |
| Vercel project | Existing `wealth-wise`, ID `prj_4P1fMaHR0qO0fcEI8aSOVCxIRIzk` |
| Production domain | `https://wealth-wise-gamma.vercel.app` |
| Framework preset | Next.js |
| Root directory | `apps/web` |
| Install command | `pnpm install --frozen-lockfile` |
| Build command | `pnpm build` |
| Output directory | Framework default; do not set `dist` |
| Runtime | Node.js 22 |
| Selected Supabase project | `gvaiwmasgzclsnrlqpqy` (dedicated WealthWise project, Tokyo) |

Verify the project and environment before changing configuration. The Supabase reference identifies the target; it does not record whether a particular release's migrations, auth delivery or isolation checks have passed. Keep that evidence with the release/PR.

The Vercel build must have access to workspace files outside `apps/web`, including `packages/`, `pnpm-lock.yaml` and `pnpm-workspace.yaml`. Enable **Include source files outside of the Root Directory** if the project settings require it. Choose a function region near the selected Supabase region where supported. Do not copy the old Vite rewrite or output-directory settings into this deployment. The root `.vercelignore` keeps legacy code, local environment files and generated artifacts out of CLI uploads.

## Release evidence — 15 September 2026

| Area | Verified state |
| --- | --- |
| Database schema | Both committed migrations were applied together inside `BEGIN`/`COMMIT` through the Supabase dashboard to the verified empty WealthWise schema. The transaction succeeded. CLI migration-history reconciliation is still pending. |
| Hosted catalog | Verified 12 application tables and 3 routines, with RLS enabled on every application table. Anonymous access and direct authenticated writes are denied; the private serializer is hidden. Expected practice-price, date and immutable-fill guards are present. No custom auth triggers were found. The CLI migration-history table is absent. |
| Hosted database probe | All nine rollback-probe groups passed against the live schema; details follow below. The probe left zero fixture users and workspaces. |
| Anonymous HTTP access | Both an anonymous table request and an anonymous `wealthwise_get_workspace` RPC request returned HTTP 401. |
| Production configuration | The public Supabase environment variables and `NEXT_PUBLIC_SITE_URL=https://wealth-wise-gamma.vercel.app` are saved in Vercel's Production environment. |
| Hosted auth configuration | The production origin and exact signup/recovery callback URLs for production and `http://127.0.0.1:4320` are saved. Email confirmation remains enabled; the minimum password length is 12. |
| Preview build | [This Vercel preview](https://wealth-wise-44ioai97v-kihih22218-kelensoncoms-projects.vercel.app) built successfully. |
| Production release | The initial release was deployed from `9d3c56b` and aliased to [wealth-wise-gamma.vercel.app](https://wealth-wise-gamma.vercel.app). Deployment `dpl_45HQFbB865p8z6NdbpUMitpXXMsz` reached READY. Homepage and dashboard were visually checked at 390px and desktop widths with no horizontal page overflow; body text is 16px. The mobile navigation drawer works. |
| Production access boundaries | Unauthenticated `/api/workspace` returns 401 with `private, no-store`; `/app` redirects to `/login` with private/no-store caching. The deployed preview also correctly rejects an invalid sign-in. |
| Local verification | Typechecking, all 67 automated tests and the production build passed. Browser demo checks covered transactions, transfers, goals, practice trading and learning progress across reloads. |
| Still to verify | Delivered signup/recovery emails, hosted authenticated browser sessions, two-user behavior through authenticated HTTP sessions, real concurrent saves from separate connections. The SQL rollback probe and anonymous HTTP checks do not establish these flows. |

The hosted rollback probe passed these nine groups:

1. Empty-workspace bootstrap and a valid save.
2. Rejection of a stale expected workspace version.
3. Two-user RLS isolation and composite ownership foreign keys.
4. Anonymous access denial.
5. Trusted practice prices and overspend/oversell rejection.
6. Atomic rollback when a later record fails validation.
7. Authoritative fill timestamps and immutable existing fills.
8. Practice buy/sell cash reconciliation and oversell rejection.
9. Safe aggregate monetary precision and India-calendar posting limits.

Cleanup was checked separately: zero fixture users or workspaces remained.

These database checks used a rollback probe; they do not claim a delivered auth email or a real user browser session. This is a record of the checks above, not a claim that all release gates below are complete. Update it with evidence after authenticated testing. GitHub and Vercel record subsequent deployment revisions and their checks.

## Local setup

```sh
nvm use
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

The dev server binds to `127.0.0.1:3000`. Use one consistent local origin for auth links and browser sessions. To configure accounts locally:

```sh
cp .env.example apps/web/.env.local
```

For a disposable local Supabase stack, install the Supabase CLI and Docker, then run `supabase start` from the repository root. Apply the committed migrations with `supabase db reset` only against that disposable local database; it resets its data. Use the URL/key printed for that local stack and restart Next.js after editing environment variables.

## Environment variables

Set these separately in Vercel's Preview and Production environments. Redeploy after changing public variables because Next.js embeds them in the build.

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | HTTPS URL of the intended Supabase project; localhost HTTP is allowed for development. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | That project's publishable key. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional legacy anon-key fallback, used only if the publishable key is absent. |
| `NEXT_PUBLIC_SITE_URL` | Canonical environment origin, for example `https://wealth-wise-gamma.vercel.app`. |

Never place a service-role key, database password or future provider credential in a `NEXT_PUBLIC_` variable. No service-role key or financial/AI provider credential is needed by this release. Missing Supabase configuration leaves the demo usable, disables auth actions and returns a clear account-storage error.

For stable staging, use a separate Supabase project and stable Vercel hostname. For PR previews, use synthetic data in a dedicated non-production project or supported database branch. Do not give arbitrary preview code production credentials/data. Where no preview backend is configured, review the public site and local demo instead.

## Database rollout

The ordered migrations are:

1. `202609140001_workspace.sql`: normalized owner-scoped schema, RLS/grants, initial workspace RPCs and fictional practice catalog.
2. `202609140002_atomic_commands.sql`: version-checked atomic persistence and append-only practice-order enforcement.

Use the Supabase migration workflow from the repository root. After authenticating the CLI, explicitly link the intended project reference, review the pending migration list/diff and rehearse against staging. Apply the migration set only to the verified target; record the applied versions and check for errors. Do not run a local reset command against a hosted environment or manually mark a failed migration as applied.

### Reconciling the initial dashboard application

The initial release applied `202609140001_workspace.sql` and `202609140002_atomic_commands.sql` together through the dashboard SQL editor, wrapped in one successful transaction. The hosted catalog and rollback probe subsequently verified the installed application schema and its rules. The CLI migration-history table is absent, so migration metadata still needs reconciliation. Do not run a normal push that attempts to reapply these already installed migrations.

Before repairing history, verify that the CLI is linked to `gvaiwmasgzclsnrlqpqy`, inspect the remote migration list, and compare the hosted tables, constraints, RLS/grants and function definitions with the exact committed files. Confirm that both versions completed and no partial or different schema is being marked as applied. Only after those checks should an operator run:

```sh
supabase migration repair --status applied 202609140001 202609140002 --linked
```

This command is documented for a future reconciliation step; it has **not** been run for this release. It changes migration-history metadata and does not execute or validate the SQL. Recheck the remote list afterward, then resume the normal versioned migration workflow for later changes.

Current flows need no Storage bucket. Imported CSV files are read in the browser, then validated transaction records are submitted. Downloaded reports and archives are generated locally. Introduce private buckets and ownership policies only when server-side retention is implemented.

## Auth and email

In Supabase Auth, set **Site URL** to the environment's canonical origin and add its exact allowed redirect URLs:

```text
https://YOUR_ORIGIN/auth/callback
https://YOUR_ORIGIN/auth/callback?next=/update-password
https://YOUR_ORIGIN/auth/confirm
```

Use `http://127.0.0.1:3000` or `http://localhost:3000` consistently for local testing. Both local callback variants appear in the committed local Supabase configuration. Keep email confirmation enabled and enforce at least the application's 12-character password minimum in the hosted auth settings.

The initial hosted configuration additionally allows the release test server at `http://127.0.0.1:4320`. This does not change the default development port. When testing at another origin or port, explicitly configure its exact callback URLs and use a matching site origin instead of relying on broad redirect wildcards.

Set up a verified sender and custom SMTP/email provider before public onboarding. Supabase's built-in development sender has recipient and delivery limits. Sender identity, domain verification and delivery settings belong to the selected environment and must be checked there.

### Recommended sender: Resend

Use **Resend** for production auth email. **testmail.app** is a receiving inbox service for testing delivery; it does not replace the SMTP sender. Resend's [Supabase SMTP setup guide](https://resend.com/docs/send-with-supabase-smtp) requires a verified sending domain and a Resend API key.

1. Add a domain you control in Resend, publish its requested DNS records and wait for verification.
2. Create a Resend API key authorized to send from that domain.
3. In the dedicated WealthWise Supabase project's **Authentication → SMTP settings**, enable custom SMTP and set:

| Setting | Value |
| --- | --- |
| SMTP host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | The Resend API key, stored only in the Supabase SMTP secret field. |
| Sender email | An address on the verified domain, such as `no-reply@YOUR_VERIFIED_DOMAIN`. |
| Sender name | `WealthWise` |

Save the settings, then test signup confirmation and password recovery with an inbox you can inspect; a testmail.app inbox can serve that purpose. Verify delivery and complete the links in a browser against the correct callback origin. Keep confirmation enabled. Do not put the SMTP key in application code, GitHub, browser-visible environment variables or screenshots. This setup is a follow-up requirement; no working Resend sender or delivered message has been verified for this release.

The standard PKCE flow expects the browser that initiated signup/recovery. To support confirmation links opened in another browser, use the implemented token-hash routes in the Supabase email templates:

```html
<!-- Confirm signup -->
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm email</a>

<!-- Recover password -->
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Reset password</a>
```

Do not substitute tokens into logs or screenshots. The [backend reference](backend.md) details callback validation and session handling.

## Release verification

For every release, run `pnpm typecheck`, `pnpm test` and `pnpm build`. GitHub's **Typecheck, test and build** job runs these checks without cloud credentials. Vercel previews provide the visual review surface; this workflow does not provision Supabase, apply hosted migrations or prove email delivery.

Before enabling real personal records in an environment, record results for these checks:

- Signup with a test email, delivered confirmation, sign-in, refresh, sign-out, recovery, expired link handling and sign-in with the updated password.
- A newly verified account starts with empty financial records; demo activity remains isolated in the browser.
- Create an account, income/expense, transfer, holding, budget, goal and debt; confirm records survive refresh and sign-in from another session.
- Use two independent test users to verify cross-user reads/writes and identifier substitution are rejected by the hosted API/RLS.
- Send competing commands from two sessions with the same workspace version: one save succeeds and the other conflicts; balances and fills remain consistent.
- Check a practice buy/sell, rejected overspend/oversell and unchanged previous fills after refresh.
- Import a valid small CSV; reject an invalid row without a partial commit; review repeat-import behavior and exported records.
- Review navigation, dialogs, keyboard focus, form errors and key views at mobile and desktop widths.

The automated PGlite tests cover schema and ownership behavior in process with auth stubs. They do not replace hosted PostgREST/auth checks, real multi-connection concurrency, email delivery or recovery rehearsal. Do not report those as completed without environment-specific evidence.

## Operating the release

Use Vercel request/build logs and Supabase database/auth logs to investigate errors. Log operation identifiers and error codes, not passwords, tokens, full workspace snapshots or imported financial content. Current error responses include `CONFLICT`, `NOT_CONFIGURED`, `DATABASE_NOT_READY` and `STORAGE_UNAVAILABLE`; the browser should refresh before retrying an uncertain write.

Set alerts appropriate to the selected plans for failures, storage consumption and unexpected authentication traffic. Scheduled user reminders, background workers, analytics and external monitoring integrations are not installed merely by deploying the application.

Confirm the selected Supabase plan's actual backup retention and recovery options before relying on it for records. Record who can restore, how to restore into a separate environment, and when a restore was last tested. The user-facing JSON archive is a readable copy; there is no complete-archive import/restore command. Account deletion is not a self-service feature in this release; handle identity/data removal through a verified owner request and the controlled Supabase administration workflow, without exposing administrative credentials to the app.

## Rollback

Record the previous Vercel deployment before promoting a release. If the web release fails, redeploy/promote the prior compatible deployment and run a smoke check. A web rollback does not reverse database writes or schema changes.

Prefer additive migrations that keep the previous app compatible. Rehearse data transformations and restore on staging before destructive schema changes. Do not delete tables or restore over production as a routine frontend rollback. When rolling back across the Vite-to-Next.js cutover, restore the previous Vercel framework/root/build configuration too; the old app expects Firebase rather than the new Supabase workspace.
