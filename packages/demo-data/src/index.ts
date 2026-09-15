import { emptyWorkspace, type Workspace } from '@wealthwise/contracts';
export const DEMO_AS_OF = '2026-09-14';
const id = (n:number) => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
export function createDemoWorkspace():Workspace {
  const s=emptyWorkspace('Alex');
  s.accounts=[{id:id(1),name:'Everyday account',type:'cash',openingBalanceMinor:8_120_000},{id:id(2),name:'Rainy day savings',type:'savings',openingBalanceMinor:25_000_000},{id:id(3),name:'Retirement savings',type:'retirement',openingBalanceMinor:60_000_000}];
  s.transactions=[
    {id:id(101),accountId:id(1),date:'2026-09-01',description:'Monthly salary',category:'Salary',amountMinor:9_600_000},
    {id:id(102),accountId:id(1),date:'2026-09-02',description:'Home rent',category:'Housing',amountMinor:-1_800_000},
    {id:id(103),accountId:id(1),date:'2026-09-07',description:'Groceries & pantry',category:'Food',amountMinor:-420_000},
    {id:id(104),accountId:id(1),date:'2026-09-09',description:'Metro & weekend trips',category:'Transport',amountMinor:-240_000},
    {id:id(105),accountId:id(1),date:'2026-09-12',description:'A night at the movies',category:'Entertainment',amountMinor:-160_000},
    {id:id(106),accountId:id(1),date:'2026-09-14',description:'Health & wellbeing',category:'Health',amountMinor:-100_000}
  ];
  s.holdings=[
    {id:id(201),name:'Meadow Index Fund',symbol:'MEADOW',assetClass:'Mutual fund',quantity:4000,priceMinor:24800,averageCostMinor:21600,asOf:DEMO_AS_OF},
    {id:id(202),name:'Cedar Technologies',symbol:'CEDAR',assetClass:'Equity',quantity:100,priceMinor:242500,averageCostMinor:214000,asOf:DEMO_AS_OF},
    {id:id(203),name:'Aurum Gold ETF',symbol:'AURUM',assetClass:'Gold',quantity:4000,priceMinor:6450,averageCostMinor:5820,asOf:DEMO_AS_OF},
    {id:id(204),name:'Terra Consumer',symbol:'TERRA',assetClass:'Equity',quantity:200,priceMinor:84000,averageCostMinor:79000,asOf:DEMO_AS_OF},
    {id:id(205),name:'Nova Industries',symbol:'NOVA',assetClass:'Equity',quantity:60.8,priceMinor:125000,averageCostMinor:108000,asOf:DEMO_AS_OF}
  ];
  s.budgets=[['Housing',2000000],['Food',1000000],['Transport',500000],['Entertainment',400000],['Health',300000],['Shopping',800000]].map(([category,limitMinor],i)=>({id:id(300+i),category:category as Workspace['budgets'][number]['category'],limitMinor:Number(limitMinor),month:'2026-09'}));
  s.goals=[{id:id(401),name:'A place to call home',targetMinor:2_000_000_00,savedMinor:480_000_00,monthlyMinor:25_000_00,targetDate:'2031-09-01',color:'forest'},{id:id(402),name:'The Japan chapter',targetMinor:300_000_00,savedMinor:180_000_00,monthlyMinor:10_000_00,targetDate:'2027-09-01',color:'coral'},{id:id(403),name:'A softer landing',targetMinor:600_000_00,savedMinor:250_000_00,monthlyMinor:15_000_00,targetDate:'2028-09-01',color:'lime'}];
  s.debts=[{id:id(501),name:'Education loan',balanceMinor:250_000_00,annualRate:8.5,remainingMonths:36}];
  s.watchlist=['NOVA','MEADOW','HARBOR'];s.completedLessons=[];
  return s;
}
