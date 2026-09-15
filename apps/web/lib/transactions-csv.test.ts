import { describe, expect, it } from 'vitest';
import { type Account, type Transaction } from '@wealthwise/contracts';
import { exportTransactionsCSV, parseCSV, previewTransactionsCSV } from './transactions-csv';

const account: Account = { id: '00000000-0000-4000-8000-000000000001', name: 'Everyday account', type: 'cash', openingBalanceMinor: 100_000 };
const header = 'date,description,category,amount_inr,account_id';

describe('transaction CSV review', () => {
  it('parses commas, escaped quotes and line endings in quoted fields', () => {
    expect(parseCSV('name,note\r\n"Coffee, cake","He said ""hello"""\r\n')).toEqual([['name', 'note'], ['Coffee, cake', 'He said "hello"']]);
    expect(() => parseCSV('name\n"unfinished')).toThrow('closing quote');
  });
  it('validates exact paise amounts and assigns repeatable IDs', async () => {
    const csv = `${header}\n2026-09-14,Groceries,Food,-250.25,${account.id}`;
    const first = await previewTransactionsCSV(csv, [account], []);
    expect(first.errors).toEqual([]); expect(first.rows[0]?.amountMinor).toBe(-25_025);
    const repeated = await previewTransactionsCSV(csv, [account], first.rows);
    expect(repeated.rows).toEqual([]); expect(repeated.skipped).toBe(1);
  });
  it('keeps a bad batch reviewable without committing or dropping the invalid row', async () => {
    const result = await previewTransactionsCSV(`${header}\n2026-09-14,Valid,Food,-25.00,${account.id}\n2026-09-15,Bad transfer,Transfer,-50.00,${account.id}\n2026-09-16,Wrong account,Food,-1.00,missing`, [account], []);
    expect(result.rows).toHaveLength(1); expect(result.errors.map(error => error.row)).toEqual([3, 4]);
  });
  it('round-trips exported IDs without duplicating normal records', async () => {
    const original = await previewTransactionsCSV(`${header}\n2026-09-14,Groceries,Food,-250.25,${account.id}`, [account], []);
    const exported = exportTransactionsCSV(original.rows, [account]);
    const result = await previewTransactionsCSV(exported, [account], original.rows);
    expect(result.errors).toEqual([]); expect(result.skipped).toBe(1); expect(result.rows).toEqual([]);
  });
  it('protects spreadsheet text and rejects formula amounts', async () => {
    const parsed = await previewTransactionsCSV(`${header}\n2026-09-14,=SUM(A1),Food,-20.00,${account.id}`, [account], []);
    expect(exportTransactionsCSV(parsed.rows, [account])).toContain('"\'=SUM(A1)"');
    const invalid = await previewTransactionsCSV(`${header}\n2026-09-14,Example,Food,=1+1,${account.id}`, [account], []);
    expect(invalid.errors).toHaveLength(1);
  });
  it('round-trips formula-like text and literal apostrophes without changing records', async () => {
    for (const description of ['=SUM(A1)', '+A1', '-A1', '@SUM(A1)', "'A literal apostrophe"]) {
      const original = await previewTransactionsCSV(`${header}\n2026-09-14,${description},Food,-20.00,${account.id}`, [account], []);
      const exported = exportTransactionsCSV(original.rows, [account]);
      const fresh = await previewTransactionsCSV(exported, [account], []);
      expect(fresh.errors).toEqual([]); expect(fresh.rows).toEqual(original.rows);
      const repeated = await previewTransactionsCSV(exported, [account], original.rows);
      expect(repeated.errors).toEqual([]); expect(repeated.skipped).toBe(1);
    }
  });
  it('skips unchanged exported transfers but never imports a new unpaired transfer', async () => {
    const transfer: Transaction = { id: '00000000-0000-4000-8000-000000000002', transferId: '00000000-0000-4000-8000-000000000002', accountId: account.id, date: '2026-09-14', description: 'Between accounts', category: 'Transfer', amountMinor: -2_000 };
    const exported = exportTransactionsCSV([transfer], [account]);
    const repeated = await previewTransactionsCSV(exported, [account], [transfer]);
    expect(repeated.errors).toEqual([]); expect(repeated.skipped).toBe(1);
    const fresh = await previewTransactionsCSV(exported, [account], []);
    expect(fresh.rows).toEqual([]); expect(fresh.errors[0]?.message).toContain('transfer action');
  });
  it('catches future posted dates during review instead of failing after confirmation', async () => {
    const result = await previewTransactionsCSV(`${header}\n2026-09-16,Future purchase,Food,-20.00,${account.id}`, [account], [], '2026-09-15');
    expect(result.rows).toEqual([]); expect(result.errors[0]?.message).toContain('today or an earlier date');
  });
});
