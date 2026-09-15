
export interface MarketIndex {
  id: string;
  name: string;
  value: string;
  change: string;
}

export const marketIndices: MarketIndex[] = [
  {
    id: 'NIFTY50',
    name: 'NIFTY 50',
    value: '22,397.20',
    change: '-0.33%',
  },
  {
    id: 'SENSEX',
    name: 'SENSEX',
    value: '73,828.91',
    change: '-0.27%',
  },
  {
    id: 'BANKNIFTY',
    name: 'BANK NIFTY',
    value: '48,060.40',
    change: '+0.01%',
  },
  {
    id: 'USDINR',
    name: 'USD/INR',
    value: '87.08',
    change: '-0.27%',
  },
];
