
export type AssetType = 'stock' | 'mutualFund' | 'pf' | 'fd' | 'gold' | 'realEstate' | 'crypto' | 'other';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  value: number;
  initialInvestment: number;
  returns: number;
  returnsPercentage: number;
  lastUpdated: string;
  growth: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
}

export interface AssetGroup {
  type: AssetType;
  label: string;
  totalValue: number;
  assets: Asset[];
  allocation: number;
  returns: number;
  returnsPercentage: number;
  color: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalInvestment: number;
  totalReturns: number;
  totalReturnsPercentage: number;
  assetGroups: AssetGroup[];
}
