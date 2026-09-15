# WealthWise

**A clearer view. A richer life.**

A personal-finance workspace for understanding money, reviewing investments, planning goals and learning through practice. Built as a modular **Next.js + TypeScript** application for **Vercel**, with **Supabase Auth and PostgreSQL** for personal accounts.

[Website](https://wealth-wise-gamma.vercel.app) · [Explore the demo](https://wealth-wise-gamma.vercel.app/demo) · [Figma design](https://www.figma.com/design/F5R5WIWueYTSWCVRUQrCk1?node-id=4-56) · [Architecture](docs/ARCHITECTURE.md) · [Deployment guide](docs/deployment.md)

## What you can do

| Area | Included in this release |
| --- | --- |
| Money | Manual cash, savings and retirement accounts; income, expenses, paired transfers and monthly category budgets. |
| Investments | Manual holdings with dated valuations, allocation, cost/gain calculations and a fictional market watchlist. |
| Planning | Goals, earmarked savings, debt records, SIP/EMI/goal calculators and saved scenario inputs. |
| Practice | Buy and sell fictional instruments with virtual cash, position checks and persistent fill history. |
| Learning | Authored lessons, knowledge checks and completion progress. |
| Review and data | Deterministic monthly insights, validated transaction CSV imports, activity exports and a JSON workspace archive. |
| Identity | Email/password signup, confirmation, sign-in, recovery, password updates and session sign-out when Supabase is configured. |

The responsive interface pairs warm ivory and forest green with Instrument Serif and Manrope. Body text and standard controls use a readable 16px base, prominent financial figures use tabular numerals, and mobile navigation keeps the primary areas within reach.

## Demo and personal accounts

`/demo` runs immediately without credentials. Its fictional workspace saves to **this browser's local storage**, survives refresh and can be restored with **Settings → Reset demo**. It does not sync across browsers and is separate from personal accounts. Clearing site storage removes local demo changes.

`/app` requires Supabase authentication. Its records are loaded and saved through server handlers into normalized PostgreSQL tables with ownership policies and version-checked transactions. A new account starts empty. Demo changes are never copied into it automatically. Missing backend configuration disables authentication actions and reports account storage as unavailable; it does not silently substitute demo records.

**Bank, brokerage, live market and AI providers are not connected.** Holdings use manual prices; market/practice instruments are fictional; insights use calculations. The monthly-review preference does not send notifications. All amounts are INR, with no foreign-exchange conversion. Supabase Storage is reserved for later file-retention features; current imports are validated in the browser and committed as transaction records.

## Run locally

Use **Node.js 22** and **pnpm 10.30.3**. The repository includes `.nvmrc` and a pinned `packageManager` field.

```sh
nvm use
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000), then explore `/demo`. If Corepack is unavailable, install pnpm 10.30.3 with your preferred package-manager installation method.

To enable accounts, copy `.env.example` to `apps/web/.env.local`, configure a selected Supabase project, apply the migrations and set its auth URLs/email sender. Follow the [deployment guide](docs/deployment.md) and [backend reference](docs/backend.md). The demo does not require this setup.

## Verify a change

```sh
pnpm typecheck
pnpm test
pnpm build
```

`pnpm check` runs all three. Typechecking first generates Next.js route types. Tests cover financial calculations, command rules, CSV handling, HTTP boundaries and the actual database migrations using PGlite. Hosted Supabase authentication, email delivery and deployment isolation still require the environment checks in the deployment guide.

## Repository map

```text
apps/web/                 Next.js routes, feature UI, server handlers and auth
packages/contracts/       Zod schemas and command/workspace contracts
packages/domain/          Financial arithmetic and pure state transitions
packages/demo-data/       Deterministic, coherent fictional workspace
supabase/migrations/      Normalized schema, ownership policies and atomic RPCs
docs/                     Architecture, backend, migration and deployment guides
legacy/vite/              Preserved original app, excluded from the workspace/build
legacy/docs/              Historical architecture reference
```

Financial values use integer paise and decimal arithmetic. Transfers do not inflate income or expenses; goal earmarks and practice funds do not increase personal net worth. The [architecture](docs/ARCHITECTURE.md) explains the current persistence model and its limits. The [migration guide](docs/migration.md) records how the three original repositories relate to this application; no Firebase account or financial-data migration runs automatically.

## Contributing and attribution

Use focused feature branches and pull requests with the relevant checks and a preview of visible changes. See [Contributing](docs/CONTRIBUTING.md).

The self-hosted **Instrument Serif** and **Manrope** fonts retain their original, unchanged SIL Open Font License notices: [Instrument Serif](apps/web/public/fonts/InstrumentSerif-OFL.txt) and [Manrope](apps/web/public/fonts/Manrope-OFL.txt). Existing repository and dependency licensing is unchanged.
