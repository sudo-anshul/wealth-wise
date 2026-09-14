import { z } from 'zod';

export const idSchema = z.uuid();
export const moneySchema = z.number().int().safe().min(0).max(100_000_000_000_000);
const name = z.string().trim().min(1).max(120);
const date = z.iso.date();
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
export const categories = ['Salary', 'Other income', 'Housing', 'Food', 'Transport', 'Shopping', 'Health', 'Learning', 'Entertainment', 'Utilities', 'Other', 'Transfer'] as const;
export const accountSchema = z.object({ id: idSchema, name, type: z.enum(['cash', 'savings', 'retirement']), openingBalanceMinor: moneySchema });
export const transactionSchema = z.object({ id: idSchema, accountId: idSchema, date, description: name, category: z.enum(categories), amountMinor: z.number().int().safe().min(-100_000_000_000).max(100_000_000_000).refine(v => v !== 0, 'Amount must be non-zero'), transferId: idSchema.optional() });
export const holdingSchema = z.object({ id: idSchema, name, symbol: z.string().trim().min(1).max(24), assetClass: z.enum(['Equity', 'Mutual fund', 'ETF', 'Gold', 'Other']), quantity: z.number().positive().max(1_000_000).multipleOf(0.000001), averageCostMinor: moneySchema, priceMinor: moneySchema, asOf: date });
export const budgetSchema = z.object({ id: idSchema, category: z.enum(categories), month, limitMinor: moneySchema.positive() });
export const goalSchema = z.object({ id: idSchema, name, targetMinor: moneySchema.positive(), savedMinor: moneySchema, monthlyMinor: moneySchema, targetDate: date, color: z.enum(['forest', 'coral', 'lime']).default('forest') });
export const debtSchema = z.object({ id: idSchema, name, balanceMinor: moneySchema, annualRate: z.number().min(0).max(60), remainingMonths: z.number().int().min(1).max(600) });
export const practiceOrderSchema = z.object({ id: idSchema, symbol: z.string().min(1).max(24), side: z.enum(['buy', 'sell']), quantity: z.number().int().positive().max(100_000), priceMinor: moneySchema.positive(), filledAt: z.iso.datetime() });
export const preferencesSchema = z.object({ name: z.string().trim().min(1).max(80), currency: z.literal('INR'), hideBalances: z.boolean(), monthlyReview: z.boolean() });
export const scenarioSchema = z.object({ id: idSchema, name, kind: z.enum(['sip', 'emi', 'goal']), principalMinor: moneySchema, monthlyMinor: moneySchema, years: z.number().int().min(1).max(50), annualRate: z.number().min(0).max(60) });
export const workspaceSchema = z.object({
  version: z.number().int().nonnegative(), accounts: z.array(accountSchema).max(100), transactions: z.array(transactionSchema).max(10_000), holdings: z.array(holdingSchema).max(500),
  budgets: z.array(budgetSchema).max(1000), goals: z.array(goalSchema).max(100), debts: z.array(debtSchema).max(100),
  watchlist: z.array(z.string().max(24)).max(100), completedLessons: z.array(z.string().max(80)).max(100), scenarios: z.array(scenarioSchema).max(100),
  practiceOrders: z.array(practiceOrderSchema).max(2000), preferences: preferencesSchema
});
export const commandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('upsert-account'), account: accountSchema }),
  z.object({ type: z.literal('delete-account'), id: idSchema }),
  z.object({ type: z.literal('upsert-transaction'), transaction: transactionSchema }),
  z.object({ type: z.literal('delete-transaction'), id: idSchema }),
  z.object({ type: z.literal('transfer'), id: idSchema, fromAccountId: idSchema, toAccountId: idSchema, amountMinor: moneySchema.positive(), date, description: name }),
  z.object({ type: z.literal('upsert-holding'), holding: holdingSchema }),
  z.object({ type: z.literal('delete-holding'), id: idSchema }),
  z.object({ type: z.literal('upsert-budget'), budget: budgetSchema }),
  z.object({ type: z.literal('delete-budget'), id: idSchema }),
  z.object({ type: z.literal('upsert-goal'), goal: goalSchema }),
  z.object({ type: z.literal('delete-goal'), id: idSchema }),
  z.object({ type: z.literal('upsert-debt'), debt: debtSchema }),
  z.object({ type: z.literal('delete-debt'), id: idSchema }),
  z.object({ type: z.literal('toggle-watchlist'), symbol: z.string().min(1).max(24) }),
  z.object({ type: z.literal('complete-lesson'), lessonId: z.string().min(1).max(80) }),
  z.object({ type: z.literal('save-preferences'), preferences: preferencesSchema }),
  z.object({ type: z.literal('save-scenario'), scenario: scenarioSchema }),
  z.object({ type: z.literal('delete-scenario'), id: idSchema }),
  z.object({ type: z.literal('place-order'), id: idSchema, symbol: z.string().min(1).max(24), side: z.enum(['buy','sell']), quantity: z.number().int().positive().max(100_000) }),
  z.object({ type: z.literal('import-transactions'), transactions: z.array(transactionSchema).min(1).max(500) })
]);
export type Workspace = z.infer<typeof workspaceSchema>;
export type Command = z.infer<typeof commandSchema>;
export type Account = z.infer<typeof accountSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type Holding = z.infer<typeof holdingSchema>;
export type Budget = z.infer<typeof budgetSchema>;
export type Goal = z.infer<typeof goalSchema>;
export type Debt = z.infer<typeof debtSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
export type Preferences = z.infer<typeof preferencesSchema>;
export type SourceMode = 'demo' | 'account';
export function emptyWorkspace(displayName = 'Your workspace'): Workspace {
  return { version: 0, accounts: [], transactions: [], holdings: [], budgets: [], goals: [], debts: [], watchlist: [], completedLessons: [], scenarios: [], practiceOrders: [], preferences: { name: displayName, currency: 'INR', hideBalances: false, monthlyReview: true } };
}
