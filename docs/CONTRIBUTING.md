# Contributing to WealthWise

Build focused changes that make the product clearer, more useful and reliable. Follow the existing [Code of Conduct](CODE_OF_CONDUCT.md).

## Development

Use Node.js 22 and pnpm 10.30.3 from the repository root:

```sh
nvm use
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://127.0.0.1:3000/demo` for a complete fictional workspace without cloud credentials. Personal accounts require the setup in the [deployment guide](deployment.md). Keep `.env.local`, access tokens and real personal data out of commits, public issues and screenshots.

The active application is in `apps/web`. Shared validation belongs in `packages/contracts`; financial calculations and domain commands belong in `packages/domain`; coherent fixtures belong in `packages/demo-data`. Treat `legacy/` as a migration reference rather than another active app.

## Branches and pull requests

Create a branch for a coherent feature or fix, such as `feat/goal-planning` or `fix/transfer-validation`. Use clear imperative commit messages describing the resulting change. Preserve actual work dates and authorship.

Keep each PR reviewable: explain the user-visible problem, resulting behavior and relevant validation. For UI changes, include a preview or screenshots at representative desktop/mobile widths. For dependent PRs, state the prerequisite and use the appropriate base branch so the diff shows only the new work. Update documentation when setup or behavior changes.

Before opening or updating a PR, run:

```sh
pnpm typecheck
pnpm test
pnpm build
```

Typechecking generates Next.js route types first. The CI workflow runs the same checks with the committed lockfile and no cloud credentials. Report checks that did not run accurately; a passing build does not prove hosted authentication, email delivery or access isolation.

## Implementation conventions

Use strict TypeScript and shared Zod schemas at input boundaries. Keep framework-independent financial rules out of React components. Monetary values use integer paise, quantities have defined precision and estimates expose their assumptions. Do not introduce random data into financial history, mix practice funds into personal totals or silently substitute fixtures when a provider fails.

Test changed financial invariants, import behavior and access boundaries. Avoid tests that merely duplicate a trivial implementation. For visible changes, verify keyboard access, labeled controls, focus and responsive layout. Read the installed Next.js documentation before relying on a version-specific API; the app's `AGENTS.md` identifies this requirement.

For database changes, add an ordered migration and meaningful allowed/denied-path tests. Keep ownership, optimistic concurrency and practice ledger rules intact. Never modify an applied migration just to make a new schema appear; introduce a new migration and describe compatibility/rollback in the PR. Rehearse hosted changes on staging before production.

## Issues

Search existing issues first. A bug report should include the route, reproduction steps, expected/actual behavior and browser/environment. Use fictional records and remove private information. A feature request should describe the task it helps a user accomplish and any constraints. The issue tracker is not a private channel for account data or credentials.

## References and attribution

Read the [architecture](ARCHITECTURE.md), [backend reference](backend.md) and [migration guide](migration.md) for current boundaries. Preserve the included font copyright and SIL Open Font License notices and all existing third-party attribution when moving or replacing assets.
