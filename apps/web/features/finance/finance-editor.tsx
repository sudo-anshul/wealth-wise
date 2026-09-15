'use client';

import { useState, type FormEvent } from 'react';
import { financeToday } from './dates';
import { ArrowRight, Check, Trash2, Info } from 'lucide-react';
import { categories, commandSchema, type Account, type Budget, type Command, type Debt, type Goal, type Holding, type Transaction } from '@wealthwise/contracts';
import { toMinor } from '@wealthwise/domain';
import { useWorkspace } from '@/components/workspace-provider';
import { Button, Dialog, Field, Input, Select, formatMoney } from '@/components/ui';

export type EditorState =
  | { kind: 'account'; entity?: Account }
  | { kind: 'transaction'; entity?: Transaction; accountId?: string }
  | { kind: 'transfer' }
  | { kind: 'holding'; entity?: Holding }
  | { kind: 'budget'; entity?: Budget; month?: string }
  | { kind: 'goal'; entity?: Goal }
  | { kind: 'debt'; entity?: Debt };

const expenseCategories = categories.filter(c => !['Salary', 'Other income', 'Transfer'].includes(c));
const entryCategories = categories.filter(category => category !== 'Transfer');
const asInput = (minor: number | undefined) => minor === undefined ? '' : (minor / 100).toFixed(2);
const today = financeToday;
const labelMap = { account: 'account', transaction: 'entry', holding: 'holding', budget: 'budget', goal: 'goal', debt: 'loan', transfer: 'transfer' };

export function FinanceEditor({ editor, onClose }: { editor: EditorState; onClose: () => void }) {
  const { state, dispatch, pending, mode } = useWorkspace();
  const entity = 'entity' in editor ? editor.entity : undefined;
  const [failure, setFailure] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [direction, setDirection] = useState(editor.kind === 'transaction' && editor.entity && editor.entity.amountMinor > 0 ? 'income' : 'expense');
  const label = labelMap[editor.kind];
  const existing = Boolean(entity);
  const transferLeg = editor.kind === 'transaction' && Boolean(editor.entity?.transferId);
  const title = deleting ? `Remove this ${transferLeg ? 'transfer' : label}?` : transferLeg ? 'A transfer, in two parts.' : `${existing ? 'Edit' : 'Add'} ${editor.kind === 'account' || editor.kind === 'transaction' ? 'an' : 'a'} ${label}.`;
  const accountOptions = state.accounts.map(a => <option value={a.id} key={a.id}>{a.name}</option>);

  async function send(command: Command) {
    const result = commandSchema.safeParse(command);
    if (!result.success) throw new Error(result.error.issues.map(issue => `${issue.path.slice(1).join(' ') || 'Input'}: ${issue.message}`).join('. '));
    await dispatch(result.data);
    onClose();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailure('');
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? '').trim();
    const amount = (key: string) => toMinor(text(key) || '0');
    const id = entity?.id ?? crypto.randomUUID();
    try {
      switch (editor.kind) {
        case 'account':
          await send({ type: 'upsert-account', account: { id, name: text('name'), type: text('accountType') as Account['type'], openingBalanceMinor: amount('openingBalance') } });
          break;
        case 'transaction':
          if (transferLeg) throw new Error('Transfer entries must be removed and recreated together.');
          await send({ type: 'upsert-transaction', transaction: { id, accountId: text('accountId'), date: text('date'), description: text('description'), category: text('category') as Transaction['category'], amountMinor: amount('amount') * (direction === 'expense' ? -1 : 1) } });
          break;
        case 'transfer':
          await send({ type: 'transfer', id, fromAccountId: text('fromAccountId'), toAccountId: text('toAccountId'), amountMinor: amount('amount'), date: text('date'), description: text('description') });
          break;
        case 'holding':
          await send({ type: 'upsert-holding', holding: { id, name: text('name'), symbol: text('symbol').toUpperCase(), assetClass: text('assetClass') as Holding['assetClass'], quantity: Number(text('quantity')), averageCostMinor: amount('averageCost'), priceMinor: amount('price'), asOf: text('asOf') } });
          break;
        case 'budget':
          await send({ type: 'upsert-budget', budget: { id, category: text('category') as Budget['category'], month: text('month'), limitMinor: amount('limit') } });
          break;
        case 'goal':
          await send({ type: 'upsert-goal', goal: { id, name: text('name'), targetMinor: amount('target'), savedMinor: amount('saved'), monthlyMinor: amount('monthly'), targetDate: text('targetDate'), color: text('color') as Goal['color'] } });
          break;
        case 'debt':
          await send({ type: 'upsert-debt', debt: { id, name: text('name'), balanceMinor: amount('balance'), annualRate: Number(text('annualRate')), remainingMonths: Number(text('remainingMonths')) } });
          break;
      }
    } catch (error) { setFailure(error instanceof Error ? error.message : 'This change could not be saved. Please try again.'); }
  }

  async function remove() {
    if (!entity || editor.kind === 'transfer') return;
    setFailure('');
    try {
      const command = { type: `delete-${editor.kind}`, id: entity.id } as Command;
      await send(command);
    } catch (error) { setFailure(error instanceof Error ? error.message : 'This item could not be removed.'); }
  }

  const description = mode === 'demo' ? 'Changes are saved to your demo workspace in this browser. No real money moves.' : 'Manual records in your personal workspace. No bank or investment account is connected.';

  return <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }} title={title} description={description}>
    <div className="finance-dialog">
      {deleting ? <>
        <p className="fin-delete-message">{transferLeg ? 'Both entries in this transfer will be removed together. Your account balances will update; total net worth remains unchanged.' : editor.kind === 'account' ? 'An account can only be removed after its transactions are removed or moved to another account.' : `This removes the ${label} from your workspace. ${editor.kind === 'transaction' ? 'Its account balance and cash-flow totals will update.' : editor.kind === 'goal' ? 'Your underlying account balances will remain unchanged.' : 'Any totals that depend on this record will update.'}`}</p>
        {failure && <div className="fin-form-error" role="alert">{failure}</div>}
        <div className="fin-form-actions"><Button variant="secondary" onClick={() => setDeleting(false)} disabled={pending}>Keep it</Button><Button onClick={remove} disabled={pending}><Trash2 size={17}/>{pending ? 'Removing…' : `Remove ${transferLeg ? 'transfer' : label}`}</Button></div>
      </> : transferLeg ? <>
        <div className="fin-detail-list"><div><span>Description</span><strong>{editor.kind === 'transaction' && editor.entity?.description}</strong></div><div><span>Amount</span><strong>{editor.kind === 'transaction' && formatMoney(Math.abs(editor.entity?.amountMinor ?? 0))}</strong></div><div><span>Record type</span><strong>Paired account transfer</strong></div></div>
        <p className="fin-dialog-copy">Both legs are saved together so a transfer never counts as income or spending. To change this transfer, remove it and create a new one.</p>
        <div className="fin-form-actions"><Button variant="ghost" onClick={() => setDeleting(true)} disabled={pending}><Trash2 size={17}/>Remove transfer</Button><Button variant="secondary" onClick={onClose}>Done</Button></div>
      </> : <form className="fin-form" onSubmit={submit}>
        {editor.kind === 'account' && <>
          <Field label="Account name"><Input name="name" defaultValue={editor.entity?.name} placeholder="Everyday savings" maxLength={120} required autoFocus/></Field>
          <Field label="Account type"><Select name="accountType" defaultValue={editor.entity?.type ?? 'cash'}><option value="cash">Everyday cash & checking</option><option value="savings">Savings</option><option value="retirement">Retirement / EPF</option></Select></Field>
          <Field label="Opening balance (₹)" hint="Use the balance immediately before your first recorded transaction. Adding older activity to an opening balance that already includes it would count that activity twice."><Input name="openingBalance" type="number" inputMode="decimal" min="0" step="0.01" defaultValue={asInput(editor.entity?.openingBalanceMinor) || '0'} required/></Field>
          <p className="fin-form-note">Use a friendly name. Do not enter account numbers, passwords, or banking credentials.</p>
        </>}
        {editor.kind === 'transaction' && <>
          <div className="fin-form-grid"><Field label="Entry type"><Select value={direction} onChange={event => setDirection(event.target.value)}><option value="expense">Money out</option><option value="income">Money in</option></Select></Field><Field label="Amount (₹)"><Input name="amount" type="number" inputMode="decimal" min="0.01" step="0.01" defaultValue={editor.entity ? asInput(Math.abs(editor.entity.amountMinor)) : ''} required/></Field></div>
          <Field label="What was it for?"><Input name="description" defaultValue={editor.entity?.description} placeholder={direction === 'expense' ? 'Groceries for the week' : 'Monthly salary'} maxLength={120} required/></Field>
          <div className="fin-form-grid"><Field label="Account"><Select name="accountId" defaultValue={editor.entity?.accountId ?? editor.accountId ?? state.accounts[0]?.id} required>{accountOptions}</Select></Field><Field label="Date"><Input name="date" type="date" max={today()} defaultValue={editor.entity?.date ?? today()} required/></Field></div>
          <Field label="Category"><Select name="category" key={direction} defaultValue={editor.entity && (editor.entity.amountMinor > 0) === (direction === 'income') ? editor.entity.category : direction === 'income' ? 'Salary' : 'Food'}>{entryCategories.map(category => <option key={category}>{category}</option>)}</Select></Field>
          <p className="fin-form-note">Moving money between your own accounts? Use the transfer action instead, so cash flow stays accurate.</p>
        </>}
        {editor.kind === 'transfer' && <>
          <div className="fin-form-grid"><Field label="From account"><Select name="fromAccountId" defaultValue={state.accounts[0]?.id} required>{accountOptions}</Select></Field><Field label="To account"><Select name="toAccountId" defaultValue={state.accounts[1]?.id} required>{accountOptions}</Select></Field></div>
          <Field label="Amount (₹)"><Input name="amount" type="number" inputMode="decimal" min="0.01" step="0.01" required autoFocus/></Field>
          <Field label="Description"><Input name="description" defaultValue="Transfer between accounts" maxLength={120} required/></Field>
          <Field label="Transfer date"><Input name="date" type="date" max={today()} defaultValue={today()} required/></Field>
          <div className="fin-notice info"><Info size={18}/><p>Two matching records will be saved together. Transfers do not increase income, spending, or net worth.</p></div>
        </>}
        {editor.kind === 'holding' && <>
          <Field label="Investment name"><Input name="name" defaultValue={editor.entity?.name} placeholder="My index fund" maxLength={120} required autoFocus/></Field>
          <div className="fin-form-grid"><Field label="Symbol or short label"><Input name="symbol" defaultValue={editor.entity?.symbol} placeholder="INDEX" maxLength={24} required/></Field><Field label="Asset class"><Select name="assetClass" defaultValue={editor.entity?.assetClass ?? 'Mutual fund'}>{['Equity', 'Mutual fund', 'ETF', 'Gold', 'Other'].map(v => <option key={v}>{v}</option>)}</Select></Field></div>
          <Field label="Units held"><Input name="quantity" type="number" inputMode="decimal" min="0.000001" max="1000000" step="0.000001" defaultValue={editor.entity?.quantity ?? ''} required/></Field>
          <div className="fin-form-grid"><Field label="Average cost per unit (₹)"><Input name="averageCost" type="number" inputMode="decimal" min="0" step="0.01" defaultValue={asInput(editor.entity?.averageCostMinor)} required/></Field><Field label="Current value per unit (₹)"><Input name="price" type="number" inputMode="decimal" min="0" step="0.01" defaultValue={asInput(editor.entity?.priceMinor)} required/></Field></div>
          <Field label="Valuation date"><Input name="asOf" type="date" max={today()} defaultValue={editor.entity?.asOf ?? today()} required/></Field>
          <p className="fin-form-note">Values are entered manually. Saving a holding records an asset; it does not place a trade or deduct money from a cash account.</p>
        </>}
        {editor.kind === 'budget' && <>
          <Field label="Spending category"><Select name="category" defaultValue={editor.entity?.category ?? 'Food'}>{expenseCategories.map(c => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="Month"><Input name="month" type="month" defaultValue={editor.entity?.month ?? editor.month ?? today().slice(0, 7)} required/></Field>
          <Field label="Monthly limit (₹)"><Input name="limit" type="number" inputMode="decimal" min="0.01" step="0.01" defaultValue={asInput(editor.entity?.limitMinor)} required/></Field>
          <p className="fin-form-note">One budget per category and month. Your spending is calculated from recorded money-out entries, excluding transfers.</p>
        </>}
        {editor.kind === 'goal' && <>
          <Field label="Give your goal a name"><Input name="name" defaultValue={editor.entity?.name} placeholder="The next chapter" maxLength={120} required autoFocus/></Field>
          <div className="fin-form-grid"><Field label="Target amount (₹)"><Input name="target" type="number" inputMode="decimal" min="0.01" step="0.01" defaultValue={asInput(editor.entity?.targetMinor)} required/></Field><Field label="Already earmarked (₹)"><Input name="saved" type="number" inputMode="decimal" min="0" step="0.01" defaultValue={asInput(editor.entity?.savedMinor) || '0'} required/></Field></div>
          <div className="fin-form-grid"><Field label="Monthly plan (₹)"><Input name="monthly" type="number" inputMode="decimal" min="0" step="0.01" defaultValue={asInput(editor.entity?.monthlyMinor) || '0'} required/></Field><Field label="Target date"><Input name="targetDate" type="date" defaultValue={editor.entity?.targetDate} required/></Field></div>
          <Field label="A little color"><Select name="color" defaultValue={editor.entity?.color ?? 'forest'}><option value="forest">Forest green</option><option value="coral">Warm coral</option><option value="lime">Fresh lime</option></Select></Field>
          <p className="fin-form-note">Goal savings earmark money you already own. They do not add assets or transfer money, and one amount should not be earmarked for several goals.</p>
        </>}
        {editor.kind === 'debt' && <>
          <Field label="Loan name"><Input name="name" defaultValue={editor.entity?.name} placeholder="Education loan" maxLength={120} required autoFocus/></Field>
          <Field label="Outstanding principal (₹)"><Input name="balance" type="number" inputMode="decimal" min="0" step="0.01" defaultValue={asInput(editor.entity?.balanceMinor)} required/></Field>
          <div className="fin-form-grid"><Field label="Annual interest rate (%)"><Input name="annualRate" type="number" inputMode="decimal" min="0" max="60" step="0.01" defaultValue={editor.entity?.annualRate ?? '9'} required/></Field><Field label="Remaining monthly payments"><Input name="remainingMonths" type="number" min="1" max="600" step="1" defaultValue={editor.entity?.remainingMonths ?? '24'} required/></Field></div>
          <p className="fin-form-note">Payments use a fixed-rate reducing-balance estimate. Fees, insurance, variable rates, and prepayments are excluded. Confirm the actual schedule with your lender.</p>
        </>}
        {failure && <div className="fin-form-error" role="alert">{failure}</div>}
        <div className="fin-form-actions">
          {existing && <Button type="button" variant="ghost" className="fin-delete" onClick={() => { setFailure(''); setDeleting(true); }} disabled={pending}><Trash2 size={17}/>Remove</Button>}
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>Cancel</Button>
          <Button type="submit" disabled={pending}>{pending ? 'Saving…' : existing ? 'Save changes' : editor.kind === 'transfer' ? 'Record transfer' : `Add ${label}`}{existing ? <Check size={17}/> : <ArrowRight size={17}/>}</Button>
        </div>
      </form>}
    </div>
  </Dialog>;
}
