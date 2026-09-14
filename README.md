# WealthWise

A calmer, clearer relationship with your money. Built with Next.js, TypeScript, and Supabase for Vercel.

The new application lives in `apps/web`; shared contracts, financial calculations, and deterministic demo data live in `packages/`. The original Vite application is preserved in `legacy/vite` as a migration reference and excluded from builds.

## Development

```sh
corepack enable
pnpm install
pnpm dev
```

```sh
pnpm test
pnpm typecheck
pnpm build
```

Financial calculations use integer paise and decimal arithmetic. Goal earmarks and practice trading funds are excluded from personal net worth. External market and AI providers are intentionally separate adapters for a later phase.

Design: warm ivory, forest green, Instrument Serif and Manrope. Standard controls and body text are 16px; financial numbers use tabular numerals. Fonts are self-hosted under their included SIL Open Font Licenses.
