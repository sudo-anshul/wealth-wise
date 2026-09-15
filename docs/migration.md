# Migration from the original applications

The redesign consolidates the user experience into one Next.js application while preserving the old source for reference. It does not automatically migrate Firebase users, financial records, browser storage or Python research history.

## Repository mapping

The architecture review inspected these source revisions:

| Original repository | Reviewed revision | Role in the new application |
| --- | --- | --- |
| [`sudo-anshul/wealth-wise`](https://github.com/sudo-anshul/wealth-wise) | `78237f9` | Primary repository and Vercel project. The original Vite source is preserved under `legacy/vite`; active code lives in `apps/web` and `packages`. |
| [`sudo-anshul/stock-market-simulator`](https://github.com/sudo-anshul/stock-market-simulator) | `db4b20f` | Practice trading is reimplemented as an integrated domain with owner-scoped persistence, fixed fictional prices and checked fills. The companion repository remains a reference. |
| [`sudo-anshul/multi-agent-advisor`](https://github.com/sudo-anshul/multi-agent-advisor) | `5ff98a1` | Research concept informs the future provider boundary. The synchronous Python/Flask AI path is not deployed or invoked by the new application. |

The reviewed revisions are migration references, not a claim that those repositories will remain at those heads. `legacy/vite` is excluded from the active pnpm workspace and Vercel upload. The original [architecture document](../legacy/docs/ARCHITECTURE.md) is retained verbatim for historical context.

## Deliberate changes

| Earlier behavior/design | Current implementation |
| --- | --- |
| Separate Vite interfaces and identities. | One responsive shell and shared contracts/domain packages. |
| Firebase/Firestore for application identity/data. | Supabase Auth and normalized PostgreSQL for new personal workspaces. |
| Random/generated performance history. | Coherent fixtures, explicit manual valuations and labeled estimates; no invented live returns. |
| Simulator identity/reset and balance boundaries spread across client code. | Isolated practice funds, server-priced fills, database version lock and immutable prior orders. |
| Synchronous AI endpoint in the request path. | Deterministic insights now; future research requires a typed provider and durable jobs. |
| Small prototype typography. | Readable 16px controls/body baseline, larger financial figures and responsive editorial hierarchy. |

The initial architecture blueprint described a larger eventual platform. This release deliberately uses one owner per workspace, INR only and normalized collection persistence guarded by a workspace version. Household membership, granular per-aggregate SQL commands, retained source files, immutable versioned scenario results, connected feeds, a research journal and durable background jobs are future work. See the [implemented architecture](ARCHITECTURE.md) before assuming a proposed endpoint or table exists.

## Existing accounts and data

Keep the original Firebase project and source intact during review. Deploying this application does not copy Firebase password hashes, grant new Supabase users access to legacy records or transform existing holdings. A Supabase account with the same email is not by itself evidence of a reviewed data-ownership mapping.

Before a future data migration:

1. Inventory actual legacy collections, identity providers, schemas, duplicate records, amounts/currencies and timestamps. Export an authorized snapshot and test its restore.
2. Define an explicit identity/account migration approach and verify ownership. Plan how affected users will sign in or confirm the new identity; do not silently merge accounts by display name or email alone.
3. Transform a synthetic/redacted rehearsal dataset. Map values to integer paise, validate dates and account relationships, and keep practice funds separate from personal assets.
4. Reconcile record counts, account balances, holdings cost/value, debt and net worth. Document records that need manual review rather than guessing financial values.
5. Rehearse the cutover and rollback in staging, including sign-in and access-isolation checks. Define a write freeze or reconciliation window before the final export/import.
6. Apply the reviewed migration to the verified target, reconcile again and keep an audit of migration IDs and exceptions. Retire legacy services only after the agreed retention/rollback period.

The current transaction CSV importer is a manual user feature, not a complete database migration tool. It accepts bounded income/expense batches into existing accounts, validates before commit and skips repeat imports of the same unchanged file. Transfers must be created with the transfer action. The JSON workspace archive is downloadable, but there is no full-archive restore or Firebase import command.

## Feature delivery and review

Use separate pull requests for coherent features such as the foundation/public UI, finance workflows, planning/practice, Supabase identity/persistence and delivery checks. For dependent branches, name the prerequisite PR and review the incremental diff. Record actual test results and deployment links on each PR. Keep commit and PR timestamps truthful; GitHub records push/PR activity when those actions occur.

Prefer additive schema changes and keep old/new runtime configuration documented during cutover. See the [deployment guide](deployment.md) for Vercel settings, environment isolation, hosted checks and rollback.
