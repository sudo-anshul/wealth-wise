import Decimal from 'decimal.js';
import { commandSchema, workspaceSchema, type Workspace, type Command, type Holding } from '@wealthwise/contracts';

export const PRACTICE_START_MINOR = 100_000_000;
export const instruments = [
  { symbol: 'NOVA', name: 'Nova Industries', priceMinor: 125_000, changePercent: 1.82, category: 'Equity', risk: 'High' },
  { symbol: 'CEDAR', name: 'Cedar Technologies', priceMinor: 242_500, changePercent: -0.74, category: 'Equity', risk: 'High' },
  { symbol: 'TERRA', name: 'Terra Consumer', priceMinor: 84_000, changePercent: 0.91, category: 'Equity', risk: 'High' },
  { symbol: 'MEADOW', name: 'Meadow Index Fund', priceMinor: 24_800, changePercent: 0.68, category: 'Mutual fund', risk: 'High', expenseRatio: 0.18 },
  { symbol: 'HARBOR', name: 'Harbor Balanced Fund', priceMinor: 16_240, changePercent: 0.34, category: 'Mutual fund', risk: 'Moderate', expenseRatio: 0.42 },
  { symbol: 'AURUM', name: 'Aurum Gold ETF', priceMinor: 6_450, changePercent: -0.22, category: 'ETF', risk: 'High', expenseRatio: 0.35 }
] as const;
export function roundMinor(value: Decimal.Value) { const result=new Decimal(value).toDecimalPlaces(0, Decimal.ROUND_HALF_UP); if(!result.isFinite()||result.abs().gt(Number.MAX_SAFE_INTEGER))throw new Error('This amount exceeds the supported precision. Use a smaller amount or projection horizon.'); return result.toNumber(); }
export function toMinor(rupees: string | number) { const n = new Decimal(rupees); if (!n.isFinite() || n.abs().gt(1e12)) throw new Error('Enter a valid amount'); return roundMinor(n.mul(100)); }
export function holdingValue(h: Holding) { return roundMinor(new Decimal(h.quantity).mul(h.priceMinor)); }
export function holdingCost(h: Holding) { return roundMinor(new Decimal(h.quantity).mul(h.averageCostMinor)); }
export function accountBalance(state: Workspace, accountId: string) { return (state.accounts.find(a => a.id === accountId)?.openingBalanceMinor ?? 0) + state.transactions.filter(t => t.accountId === accountId).reduce((s,t) => s + t.amountMinor, 0); }
export function portfolioValue(state: Workspace) { return state.holdings.reduce((sum,h) => sum + holdingValue(h), 0); }
export function netWorth(state: Workspace) { return state.accounts.reduce((sum,a) => sum + accountBalance(state,a.id),0) + portfolioValue(state) - state.debts.reduce((sum,d) => sum + d.balanceMinor,0); }
export function monthlyCashflow(state: Workspace, month: string) {
  const tx = state.transactions.filter(t => t.date.startsWith(month) && !t.transferId && t.category !== 'Transfer');
  const incomeMinor = tx.filter(t => t.amountMinor > 0).reduce((s,t) => s + t.amountMinor,0);
  const expenseMinor = -tx.filter(t => t.amountMinor < 0).reduce((s,t) => s + t.amountMinor,0);
  return { incomeMinor, expenseMinor, savingsMinor: incomeMinor - expenseMinor };
}
export function categorySpending(state: Workspace, month: string) { return state.transactions.filter(t=>t.date.startsWith(month)&&t.amountMinor<0&&!t.transferId&&t.category!=='Transfer').reduce<Record<string,number>>((out,t)=>({...out,[t.category]:(out[t.category]??0)-t.amountMinor}),{}); }
export function calculateSIP(monthlyMinor: number, annualRate: number, years: number, initialMinor = 0) {
  if (![monthlyMinor,annualRate,years,initialMinor].every(Number.isFinite) || monthlyMinor < 0 || initialMinor < 0 || annualRate < 0 || annualRate > 60 || years < 1 || years > 50 || !Number.isInteger(years)) throw new Error('Use a valid amount, a 0–60% return, and a 1–50 year horizon.');
  const rate = new Decimal(annualRate).div(1200); let value = new Decimal(initialMinor);
  const points = [{ year: 0, valueMinor: initialMinor, investedMinor: initialMinor }];
  for (let m=1;m<=years*12;m++) { value = value.mul(rate.plus(1)).plus(monthlyMinor); if (m%12===0) points.push({year:m/12,valueMinor:roundMinor(value),investedMinor:initialMinor+monthlyMinor*m}); }
  const investedMinor = initialMinor + monthlyMinor*12*years; const totalMinor = roundMinor(value);
  return { investedMinor, totalMinor, growthMinor: totalMinor-investedMinor, points };
}
export function calculateEMI(principalMinor: number, annualRate: number, months: number) {
  if (![principalMinor,annualRate,months].every(Number.isFinite) || principalMinor<0 || annualRate<0 || annualRate>60 || months<1 || months>600 || !Number.isInteger(months)) throw new Error('Use a valid amount, a 0–60% rate, and a 1–600 month term.');
  const rate=new Decimal(annualRate).div(1200); const factor=rate.plus(1).pow(months);
  const installment = rate.isZero()?new Decimal(principalMinor).div(months):new Decimal(principalMinor).mul(rate).mul(factor).div(factor.minus(1));
  const monthlyMinor=roundMinor(installment); const totalMinor=roundMinor(installment.mul(months));
  return {monthlyMinor,totalMinor,interestMinor:totalMinor-principalMinor};
}
export function practicePortfolio(state: Workspace) {
  let cashMinor=PRACTICE_START_MINOR; const bySymbol:Record<string,{symbol:string,quantity:number,costMinor:number}>={};
  for (const order of state.practiceOrders) {
    const h=bySymbol[order.symbol]??{symbol:order.symbol,quantity:0,costMinor:0}; const value=order.quantity*order.priceMinor;
    if(order.side==='buy'){h.quantity+=order.quantity;h.costMinor+=value;cashMinor-=value;}
    else{const average=h.quantity?h.costMinor/h.quantity:0;h.costMinor=roundMinor(new Decimal(h.costMinor).minus(new Decimal(average).mul(order.quantity)));h.quantity-=order.quantity;cashMinor+=value;}
    bySymbol[order.symbol]=h;
  }
  const holdings=Object.values(bySymbol).filter(h=>h.quantity>0).map(h=>({...h,priceMinor:instruments.find(i=>i.symbol===h.symbol)?.priceMinor??0,valueMinor:h.quantity*(instruments.find(i=>i.symbol===h.symbol)?.priceMinor??0)}));
  const investedMinor=holdings.reduce((s,h)=>s+h.valueMinor,0);return {cashMinor,holdings,investedMinor,totalMinor:cashMinor+investedMinor};
}
const upsert=<T extends {id:string}>(list:T[],item:T)=>list.some(x=>x.id===item.id)?list.map(x=>x.id===item.id?item:x):[...list,item];
export function applyCommand(previous:Workspace,input:Command,now=new Date().toISOString()):Workspace {
  const command=commandSchema.parse(input); const s=structuredClone(previous);
  switch(command.type){
    case 'upsert-account': s.accounts=upsert(s.accounts,command.account);break;
    case 'delete-account': if(s.transactions.some(t=>t.accountId===command.id))throw new Error('Remove or move this account’s transactions first.');s.accounts=s.accounts.filter(a=>a.id!==command.id);break;
    case 'upsert-transaction':{
      if(command.transaction.transferId||command.transaction.category==='Transfer'||s.transactions.some(t=>t.id===command.transaction.id&&t.transferId))throw new Error('Use the transfer action to move money between accounts.');
      if(!s.accounts.some(a=>a.id===command.transaction.accountId))throw new Error('Choose an existing account.');
      s.transactions=upsert(s.transactions,command.transaction);break;
    }
    case 'delete-transaction':{const item=s.transactions.find(t=>t.id===command.id);s.transactions=s.transactions.filter(t=>t.id!==command.id&&(!item?.transferId||t.transferId!==item.transferId));break;}
    case 'transfer':{
      if(command.fromAccountId===command.toAccountId)throw new Error('Choose two different accounts.');
      if(![command.fromAccountId,command.toAccountId].every(id=>s.accounts.some(a=>a.id===id)))throw new Error('Choose existing accounts.');
      if(s.transactions.some(t=>t.transferId===command.id))throw new Error('This transfer has already been saved.');
      if(accountBalance(s,command.fromAccountId)<command.amountMinor)throw new Error('The source account has insufficient funds.');
      const outId=command.id;const inId=command.id.slice(0,-1)+(command.id.endsWith('f')?'0':(parseInt(command.id.slice(-1),16)+1).toString(16));
      if(s.transactions.some(t=>t.id===outId||t.id===inId))throw new Error('Transfer identifier already exists. Please try again.');
      const common={date:command.date,description:command.description,category:'Transfer' as const,transferId:command.id};
      s.transactions.push({...common,id:outId,accountId:command.fromAccountId,amountMinor:-command.amountMinor},{...common,id:inId,accountId:command.toAccountId,amountMinor:command.amountMinor});break;
    }
    case 'upsert-holding': s.holdings=upsert(s.holdings,command.holding);break;
    case 'delete-holding': s.holdings=s.holdings.filter(h=>h.id!==command.id);break;
    case 'upsert-budget':if(s.budgets.some(b=>b.id!==command.budget.id&&b.month===command.budget.month&&b.category===command.budget.category))throw new Error('A budget already exists for this category and month.');s.budgets=upsert(s.budgets,command.budget);break;
    case 'delete-budget':s.budgets=s.budgets.filter(b=>b.id!==command.id);break;
    case 'upsert-goal':if(command.goal.savedMinor>command.goal.targetMinor)throw new Error('Earmarked savings cannot exceed the goal target.');s.goals=upsert(s.goals,command.goal);break;
    case 'delete-goal':s.goals=s.goals.filter(g=>g.id!==command.id);break;
    case 'upsert-debt':s.debts=upsert(s.debts,command.debt);break;
    case 'delete-debt':s.debts=s.debts.filter(d=>d.id!==command.id);break;
    case 'toggle-watchlist':if(!instruments.some(i=>i.symbol===command.symbol))throw new Error('Instrument is unavailable.');s.watchlist=s.watchlist.includes(command.symbol)?s.watchlist.filter(x=>x!==command.symbol):[...s.watchlist,command.symbol];break;
    case 'complete-lesson':if(!s.completedLessons.includes(command.lessonId))s.completedLessons.push(command.lessonId);break;
    case 'save-preferences':s.preferences=command.preferences;break;
    case 'save-scenario':s.scenarios=upsert(s.scenarios,command.scenario);break;
    case 'delete-scenario':s.scenarios=s.scenarios.filter(x=>x.id!==command.id);break;
    case 'place-order':{
      if(s.practiceOrders.some(o=>o.id===command.id))throw new Error('This order has already been filled.');
      const instrument=instruments.find(i=>i.symbol===command.symbol);if(!instrument)throw new Error('Instrument is unavailable.');
      const portfolio=practicePortfolio(s);
      if(command.side==='buy'&&portfolio.cashMinor<command.quantity*instrument.priceMinor)throw new Error('Insufficient virtual cash.');
      if(command.side==='sell'&&(portfolio.holdings.find(h=>h.symbol===command.symbol)?.quantity??0)<command.quantity)throw new Error('You cannot sell more shares than you own.');
      s.practiceOrders.push({id:command.id,symbol:command.symbol,side:command.side,quantity:command.quantity,priceMinor:instrument.priceMinor,filledAt:now});break;
    }
    case 'import-transactions':{
      const ids=new Set(s.transactions.map(t=>t.id));for(const t of command.transactions){if(ids.has(t.id))throw new Error('Duplicate transaction ID in import.');ids.add(t.id);if(!s.accounts.some(a=>a.id===t.accountId))throw new Error('Import references an unknown account.');if(t.transferId||t.category==='Transfer')throw new Error('Import income and expenses; use the transfer action separately.');}
      s.transactions.push(...command.transactions);break;
    }
  }
  s.version+=1;return workspaceSchema.parse(s);
}

export function csvCell(value:unknown){let text=String(value??'');if(/^[=+@\-\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}
export function transactionsCSV(state:Workspace){return ['date,description,category,amount_inr,account',...state.transactions.map(t=>[t.date,t.description,t.category,(t.amountMinor/100).toFixed(2),state.accounts.find(a=>a.id===t.accountId)?.name??''].map(csvCell).join(','))].join('\r\n');}

/** Provider contracts keep financial API payloads out of the domain. */
export interface MarketDataProvider { source: 'sample'|'licensed'; getQuote(symbol:string):Promise<{symbol:string;priceMinor:number;asOf:string;currency:'INR'}>; }
export interface ResearchProvider { createRun(input:{question:string;workspaceSummary:string}):Promise<{runId:string;status:'queued'}>; }
