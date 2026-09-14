import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  resolve: { alias: {
    '@wealthwise/contracts': fileURLToPath(new URL('./packages/contracts/src/index.ts', import.meta.url)),
    '@wealthwise/domain': fileURLToPath(new URL('./packages/domain/src/index.ts', import.meta.url)),
    '@wealthwise/demo-data': fileURLToPath(new URL('./packages/demo-data/src/index.ts', import.meta.url))
  } },
  test: { include: ['packages/**/*.test.ts', 'apps/web/**/*.test.ts'], environment: 'node' }
});
