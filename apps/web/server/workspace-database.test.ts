import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { applyCommand } from '@wealthwise/domain';
import type { Workspace } from '@wealthwise/contracts';

const USER_A = '10000000-0000-4000-8000-000000000001';
const USER_B = '10000000-0000-4000-8000-000000000002';
const ACCOUNT_A = '20000000-0000-4000-8000-000000000001';
const ACCOUNT_B = '20000000-0000-4000-8000-000000000002';
const ORDER_A = '30000000-0000-4000-8000-000000000001';
const ORDER_B = '30000000-0000-4000-8000-000000000002';
let db: PGlite;

async function identity(user: string, role = 'authenticated') {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
  await db.exec(`set role ${role}`);
}
async function get(): Promise<Workspace> {
  return (await db.query<{ workspace: Workspace }>('select public.wealthwise_get_workspace() as workspace')).rows[0].workspace;
}
async function save(workspace: Workspace, expectedVersion = workspace.version - 1): Promise<Workspace> {
  return (await db.query<{ workspace: Workspace }>('select public.wealthwise_save_workspace($1,$2::jsonb) as workspace', [expectedVersion, JSON.stringify(workspace)])).rows[0].workspace;
}
const account = (id = ACCOUNT_A) => ({ id, name: 'Main account', type: 'savings' as const, openingBalanceMinor: 500_000 });
const order = (state: Workspace, id = ORDER_A, side: 'buy'|'sell' = 'buy', quantity = 2) => applyCommand(state, { type: 'place-order', id, symbol: 'NOVA', side, quantity });

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    grant usage on schema auth to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
    grant execute on function auth.jwt() to anon,authenticated;
    insert into auth.users(id) values ('${USER_A}'),('${USER_B}');
  `);
  for (const file of ['202609140001_workspace.sql', '202609140002_atomic_commands.sql']) {
    const path = fileURLToPath(new URL(`../../../supabase/migrations/${file}`, import.meta.url));
    await db.exec(readFileSync(path, 'utf8'));
  }
}, 30_000);
beforeEach(async () => {
  await db.exec('reset role; truncate public.wealthwise_workspaces cascade;');
  await identity(USER_A);
});
afterAll(async () => { await db?.close(); });

describe('normalized Supabase workspace persistence', () => {
  it('round-trips private records and hides them from another user through RLS', async () => {
    const state = await get();
    const written = await save(applyCommand(state, { type: 'upsert-account', account: account() }));
    expect(written.version).toBe(1);
    expect(written.accounts).toEqual([account()]);
    await identity(USER_B);
    expect((await get()).accounts).toEqual([]);
    expect((await db.query('select * from public.wealthwise_accounts')).rows).toEqual([]);
    await expect(db.query('select public.wealthwise_read_workspace($1)', [USER_A])).rejects.toMatchObject({ code: '42501' });
    await expect(db.query('insert into public.wealthwise_accounts(user_id,id,position,name,type,opening_balance_minor) values($1,$2,0,$3,$4,0)', [USER_B, ACCOUNT_B, 'Bad write', 'savings'])).rejects.toMatchObject({ code: '42501' });
    await identity(USER_A);
    expect((await get()).accounts).toEqual([account()]);
  });

  it('rejects anonymous reads/bootstrap and an authenticated request without an identity', async () => {
    await identity('', 'anon');
    await expect(get()).rejects.toMatchObject({ code: '42501' });
    await expect(db.query('select * from public.wealthwise_workspaces')).rejects.toMatchObject({ code: '42501' });
    await identity('');
    await expect(get()).rejects.toMatchObject({ code: '42501' });
  });

  it('allows exactly one save at an expected version and leaves the winner intact', async () => {
    const previous = await get();
    const first = applyCommand(previous, { type: 'upsert-account', account: account() });
    const second = applyCommand(previous, { type: 'upsert-account', account: account(ACCOUNT_B) });
    const results = await Promise.allSettled([save(first, 0), save(second, 0)]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    const conflict = results.find(result => result.status === 'rejected') as PromiseRejectedResult;
    expect(conflict.reason).toMatchObject({ code: '40001' });
    expect((await get()).version).toBe(1);
    expect((await get()).accounts).toHaveLength(1);
  });

  it('enforces same-owner account references even when calling the RPC directly', async () => {
    await save(applyCommand(await get(), { type: 'upsert-account', account: account() }));
    await identity(USER_B);
    const other = await get();
    other.version++;
    other.transactions.push({ id: ORDER_A, accountId: ACCOUNT_A, date: '2026-09-14', description: 'Cross owner', category: 'Food', amountMinor: -100 });
    await expect(save(other)).rejects.toMatchObject({ code: '23503' });
    expect((await get()).version).toBe(0);
    expect((await get()).transactions).toEqual([]);
  });

  it('stores paired transfers and rejects an unbalanced replacement atomically', async () => {
    let state = await save(applyCommand(await get(), { type: 'upsert-account', account: account() }));
    state = await save(applyCommand(state, { type: 'upsert-account', account: account(ACCOUNT_B) }));
    state = await save(applyCommand(state, { type: 'transfer', id: ORDER_A, fromAccountId: ACCOUNT_A, toAccountId: ACCOUNT_B, amountMinor: 12345, date: '2026-09-14', description: 'Savings transfer' }));
    expect(state.transactions).toHaveLength(2);
    expect(state.transactions.reduce((sum, item) => sum + item.amountMinor, 0)).toBe(0);
    const invalid = structuredClone(state); invalid.version++; invalid.transactions.pop();
    await expect(save(invalid)).rejects.toMatchObject({ code: '22023' });
    expect((await get()).transactions).toHaveLength(2);
    expect((await get()).version).toBe(state.version);
  });

  it('fills at the server fixture price and preserves the complete immutable history', async () => {
    let state = await save(order(await get()));
    expect(state.practiceOrders[0]).toMatchObject({ id: ORDER_A, priceMinor: 125000, quantity: 2 });
    expect(state.practiceOrders[0].filledAt).toMatch(/Z$/);
    state = await save(order(state, ORDER_B, 'sell', 1));
    expect(state.practiceOrders).toHaveLength(2);
    const altered = structuredClone(state); altered.version++; altered.practiceOrders[0].priceMinor = 1;
    await expect(save(altered)).rejects.toMatchObject({ code: '22023' });
    const removed = structuredClone(state); removed.version++; removed.practiceOrders.shift();
    await expect(save(removed)).rejects.toMatchObject({ code: '22023' });
    expect((await get()).practiceOrders).toEqual(state.practiceOrders);
  });

  it('rejects forged prices, overspending and selling an unowned position at the SQL boundary', async () => {
    const previous = await get();
    const forgedPrice = order(previous); forgedPrice.practiceOrders[0].priceMinor = 1;
    await expect(save(forgedPrice)).rejects.toMatchObject({ code: '22023' });
    const tooLarge = order(previous); tooLarge.practiceOrders[0].quantity = 100000;
    await expect(save(tooLarge)).rejects.toMatchObject({ code: '22023' });
    const unownedSell = order(previous); unownedSell.practiceOrders[0].side = 'sell';
    await expect(save(unownedSell)).rejects.toMatchObject({ code: '22023' });
    expect((await get()).practiceOrders).toEqual([]);
    expect((await get()).version).toBe(0);
    await expect(db.query("update public.wealthwise_practice_instruments set price_minor=1 where symbol='NOVA'")).rejects.toMatchObject({ code: '42501' });
  });

  it('rolls back a valid practice fill if another part of the same snapshot fails', async () => {
    const invalid = order(await get());
    invalid.transactions.push({ id: ORDER_B, accountId: ACCOUNT_A, date: '2026-09-14', description: 'Missing account', category: 'Food', amountMinor: -100 });
    await expect(save(invalid)).rejects.toMatchObject({ code: '23503' });
    expect((await get()).practiceOrders).toEqual([]);
    expect((await get()).version).toBe(0);
    expect((await save(order(await get()))).practiceOrders).toHaveLength(1);
  });

  it('rejects fractional precision beyond six places and duplicate budget periods', async () => {
    const badQuantity = await get(); badQuantity.version++;
    badQuantity.holdings.push({ id: ORDER_A, name: 'Holding', symbol: 'NOVA', assetClass: 'Equity', quantity: 1.1234567, averageCostMinor: 123, priceMinor: 124, asOf: '2026-09-14' });
    await expect(save(badQuantity)).rejects.toMatchObject({ code: '22023' });
    const duplicate = await get(); duplicate.version++;
    duplicate.budgets.push({ id: ORDER_A, category: 'Food', month: '2026-09', limitMinor: 10000 }, { id: ORDER_B, category: 'Food', month: '2026-09', limitMinor: 12000 });
    await expect(save(duplicate)).rejects.toMatchObject({ code: '23505' });
    expect((await get()).version).toBe(0);
  });
});
