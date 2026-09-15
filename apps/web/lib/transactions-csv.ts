import { categories, transactionSchema, type Account, type Transaction } from '@wealthwise/contracts';
import { toMinor } from '@wealthwise/domain';
import { financeToday } from '@/features/finance/dates';

export type ImportPreview = { rows: Transaction[]; errors: { row: number; message: string }[]; skipped: number; totalRows: number };

/** RFC-style quoted CSV parsing. A malformed file is rejected before any records are committed. */
export function parseCSV(text: string): string[][] {
  if (text.length > 2_000_000) throw new Error('Choose a CSV smaller than 2 MB.');
  const input = text.replace(/^\uFEFF/, ''); const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false; let closedQuote = false;
  function endCell() { row.push(cell); cell = ''; closedQuote = false; }
  function endRow() { endCell(); if (row.some(value => value.trim())) rows.push(row); row = []; }
  for (let index = 0; index < input.length; index++) {
    const character = input[index]!;
    if (quoted) { if (character === '"') { if (input[index + 1] === '"') { cell += '"'; index++; } else { quoted = false; closedQuote = true; } } else cell += character; continue; }
    if (character === ',') { endCell(); continue; }
    if (character === '\n' || character === '\r') { if (character === '\r' && input[index + 1] === '\n') index++; endRow(); continue; }
    if (closedQuote) { if (character.trim()) throw new Error('A quoted value contains unexpected text after its closing quote.'); continue; }
    if (character === '"') { if (cell.trim()) throw new Error('A quote must start at the beginning of a CSV value.'); cell = ''; quoted = true; continue; }
    cell += character;
  }
  if (quoted) throw new Error('A quoted value is missing its closing quote.');
  if (cell.length || row.length || closedQuote) endRow();
  return rows;
}

async function digest(text: string) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))].map(value => value.toString(16).padStart(2, '0')).join(''); }
function rowUUID(hash: string) { const h = `${hash.slice(0, 12)}8${hash.slice(13, 16)}${((parseInt(hash[16]!, 16) & 3) | 8).toString(16)}${hash.slice(17, 32)}`; return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`; }

export async function previewTransactionsCSV(text: string, accounts: Account[], existing: Transaction[], today = financeToday()): Promise<ImportPreview> {
  const matrix = parseCSV(text); if (matrix.length < 2) throw new Error('Include a header and at least one transaction row.');
  if (matrix.length > 501) throw new Error('Import up to 500 transactions at a time. Split this file into smaller batches.');
  const headers = matrix[0]!.map(value => value.trim().toLowerCase());
  if (new Set(headers).size !== headers.length) throw new Error('The CSV has duplicate column names.');
  for (const column of ['date', 'description', 'category']) if (!headers.includes(column)) throw new Error(`The CSV needs a ${column} column.`);
  if (!headers.includes('amount_inr') && !headers.includes('amount')) throw new Error('The CSV needs an amount_inr or amount column, in rupees.');
  if (!headers.includes('account_id') && !headers.includes('account')) throw new Error('The CSV needs an account_id or account column.');
  const fingerprint = await digest(text.replace(/\r\n/g, '\n').trim()); const rows: Transaction[] = []; const errors: ImportPreview['errors'] = []; let skipped = 0;
  const ids = new Set<string>(); const existingById = new Map(existing.map(transaction => [transaction.id, transaction]));
  for (let index = 1; index < matrix.length; index++) {
    const cells = matrix[index]!; const rowNumber = index + 1;
    try {
      if (cells.length !== headers.length) throw new Error(`Expected ${headers.length} columns, found ${cells.length}.`);
      const values = Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex]!.trim()]));
      // Only our explicitly marked exports undo spreadsheet escaping. Ordinary imports keep literal apostrophes.
      if (values.text_encoding === 'spreadsheet-safe-v1') {
        for (const key of ['description', 'account']) if (values[key]?.startsWith("'")) values[key] = values[key]!.slice(1);
      }
      const accountReference = values.account_id || values.account || '';
      const matching = accounts.filter(account => account.id === accountReference || account.name.toLowerCase() === accountReference.toLowerCase());
      if (!matching.length) throw new Error('Account not found. Use an account ID or name from this workspace.');
      if (matching.length > 1) throw new Error('More than one account has this name. Use its account ID.');
      const amount = (values.amount_inr ?? values.amount ?? '').replace(/^'(?=[+-]?\d)/, '');
      if (!/^[+-]?\d+(?:\.\d{1,2})?$/.test(amount)) throw new Error('Amount must be rupees with up to two decimal places, without currency symbols or thousands separators.');
      if (!(categories as readonly string[]).includes(values.category ?? '')) throw new Error(`Choose a known category, such as Food, Housing, Salary or Other.`);
      const parsed = transactionSchema.safeParse({ id: values.id || rowUUID(await digest(`${fingerprint}:${index}`)), accountId: matching[0]!.id, date: values.date, description: values.description, category: values.category, amountMinor: toMinor(amount) });
      if (!parsed.success) throw new Error(parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(' '));
      const transaction = parsed.data;
      if (transaction.date > today) throw new Error('Use today or an earlier date for posted entries. Future plans belong in goals.');
      if (ids.has(transaction.id)) throw new Error('This transaction ID appears more than once in the file.'); ids.add(transaction.id);
      const found = existingById.get(transaction.id);
      if (found) { if (found.accountId === transaction.accountId && found.date === transaction.date && found.amountMinor === transaction.amountMinor && found.category === transaction.category && found.description === transaction.description) { skipped++; continue; } throw new Error('This ID belongs to a different existing transaction. Imports do not overwrite records.'); }
      if (transaction.category === 'Transfer') throw new Error('Use the transfer action for linked transfers between your own accounts.');
      rows.push(transaction);
    } catch (error) { errors.push({ row: rowNumber, message: error instanceof Error ? error.message : 'This row could not be read.' }); }
  }
  return { rows, errors, skipped, totalRows: matrix.length - 1 };
}

function cell(value: string, numeric = false) { const safe = !numeric && /^[=+@'\-\t\r\n]/.test(value) ? `'${value}` : value; return `"${safe.replaceAll('"', '""')}"`; }
export function exportTransactionsCSV(transactions: Transaction[], accounts: Account[]) {
  const header = 'id,date,description,category,amount_inr,account_id,account,text_encoding';
  return [header, ...transactions.map(transaction => [cell(transaction.id), cell(transaction.date), cell(transaction.description), cell(transaction.category), cell((transaction.amountMinor / 100).toFixed(2), true), cell(transaction.accountId), cell(accounts.find(account => account.id === transaction.accountId)?.name ?? ''), 'spreadsheet-safe-v1'].join(','))].join('\r\n');
}
