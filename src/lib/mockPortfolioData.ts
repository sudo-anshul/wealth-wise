
import { Asset, AssetGroup, AssetType, PortfolioSummary } from "@/types/portfolio";
import { 
  TrendingUp, 
  BarChart3, 
  Landmark, 
  Wallet, 
  Coins, 
  Building2, 
  Bitcoin, 
  CircleDollarSign 
} from "lucide-react";

const generateMockAssets = (): Asset[] => {
  return [
    // Stocks
    {
      id: "stock-1",
      name: "Reliance Industries",
      type: "stock",
      value: 250000,
      initialInvestment: 200000,
      returns: 50000,
      returnsPercentage: 25,
      lastUpdated: "2023-08-15",
      growth: "positive",
    },
    {
      id: "stock-2",
      name: "HDFC Bank",
      type: "stock",
      value: 180000,
      initialInvestment: 150000,
      returns: 30000,
      returnsPercentage: 20,
      lastUpdated: "2023-08-15",
      growth: "positive",
    },
    {
      id: "stock-3",
      name: "Infosys Ltd",
      type: "stock",
      value: 120000,
      initialInvestment: 130000,
      returns: -10000,
      returnsPercentage: -7.69,
      lastUpdated: "2023-08-15",
      growth: "negative",
    },
    
    // Mutual Funds
    {
      id: "mf-1",
      name: "Axis Bluechip Fund",
      type: "mutualFund",
      value: 300000,
      initialInvestment: 250000,
      returns: 50000,
      returnsPercentage: 20,
      lastUpdated: "2023-08-14",
      growth: "positive",
    },
    {
      id: "mf-2",
      name: "SBI Small Cap Fund",
      type: "mutualFund",
      value: 150000,
      initialInvestment: 100000,
      returns: 50000,
      returnsPercentage: 50,
      lastUpdated: "2023-08-14",
      growth: "positive",
    },
    
    // Provident Fund
    {
      id: "pf-1",
      name: "Employee Provident Fund",
      type: "pf",
      value: 500000,
      initialInvestment: 450000,
      returns: 50000,
      returnsPercentage: 11.11,
      lastUpdated: "2023-07-31",
      growth: "positive",
    },
    
    // Fixed Deposits
    {
      id: "fd-1",
      name: "HDFC Bank FD",
      type: "fd",
      value: 200000,
      initialInvestment: 200000,
      returns: 0,
      returnsPercentage: 0,
      lastUpdated: "2023-08-01",
      growth: "neutral",
    },
    {
      id: "fd-2",
      name: "SBI Tax Saver FD",
      type: "fd",
      value: 150000,
      initialInvestment: 150000,
      returns: 0,
      returnsPercentage: 0,
      lastUpdated: "2023-08-01",
      growth: "neutral",
    },
    
    // Gold
    {
      id: "gold-1",
      name: "Digital Gold",
      type: "gold",
      value: 100000,
      initialInvestment: 80000,
      returns: 20000,
      returnsPercentage: 25,
      lastUpdated: "2023-08-10",
      growth: "positive",
    },
    
    // Real Estate
    {
      id: "re-1",
      name: "Residential Property",
      type: "realEstate",
      value: 5000000,
      initialInvestment: 4000000,
      returns: 1000000,
      returnsPercentage: 25,
      lastUpdated: "2023-06-30",
      growth: "positive",
    },
    
    // Cryptocurrency
    {
      id: "crypto-1",
      name: "Bitcoin",
      type: "crypto",
      value: 50000,
      initialInvestment: 70000,
      returns: -20000,
      returnsPercentage: -28.57,
      lastUpdated: "2023-08-15",
      growth: "negative",
    },
  ];
};

const getAssetIcon = (type: AssetType) => {
  switch (type) {
    case 'stock':
      return TrendingUp;
    case 'mutualFund':
      return BarChart3;
    case 'pf':
      return Landmark;
    case 'fd':
      return Wallet;
    case 'gold':
      return Coins;
    case 'realEstate':
      return Building2;
    case 'crypto':
      return Bitcoin;
    default:
      return CircleDollarSign;
  }
};

const getAssetLabel = (type: AssetType): string => {
  switch (type) {
    case 'stock':
      return 'Stocks';
    case 'mutualFund':
      return 'Mutual Funds';
    case 'pf':
      return 'Provident Funds';
    case 'fd':
      return 'Fixed Deposits';
    case 'gold':
      return 'Gold';
    case 'realEstate':
      return 'Real Estate';
    case 'crypto':
      return 'Cryptocurrency';
    default:
      return 'Other Assets';
  }
};

const getAssetColor = (type: AssetType): string => {
  switch (type) {
    case 'stock':
      return '#8B5CF6';
    case 'mutualFund':
      return '#10B981';
    case 'pf':
      return '#3B82F6';
    case 'fd':
      return '#F59E0B';
    case 'gold':
      return '#F97316';
    case 'realEstate':
      return '#6366F1';
    case 'crypto':
      return '#EC4899';
    default:
      return '#6B7280';
  }
};

export const generatePortfolioSummary = (): PortfolioSummary => {
  const assets = generateMockAssets();
  
  // Group assets by type
  const groupedAssets = assets.reduce((acc, asset) => {
    if (!acc[asset.type]) {
      acc[asset.type] = [];
    }
    acc[asset.type].push(asset);
    return acc;
  }, {} as Record<AssetType, Asset[]>);
  
  // Calculate totals
  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
  const totalInvestment = assets.reduce((sum, asset) => sum + asset.initialInvestment, 0);
  const totalReturns = totalValue - totalInvestment;
  const totalReturnsPercentage = (totalReturns / totalInvestment) * 100;
  
  // Create asset groups
  const assetGroups: AssetGroup[] = Object.entries(groupedAssets).map(([type, assets]) => {
    const groupTotalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
    const groupInitialInvestment = assets.reduce((sum, asset) => sum + asset.initialInvestment, 0);
    const groupReturns = groupTotalValue - groupInitialInvestment;
    const groupReturnsPercentage = (groupReturns / groupInitialInvestment) * 100;
    
    return {
      type: type as AssetType,
      label: getAssetLabel(type as AssetType),
      totalValue: groupTotalValue,
      assets,
      allocation: (groupTotalValue / totalValue) * 100,
      returns: groupReturns,
      returnsPercentage: groupReturnsPercentage,
      color: getAssetColor(type as AssetType)
    };
  });
  
  // Sort asset groups by allocation (descending)
  assetGroups.sort((a, b) => b.allocation - a.allocation);
  
  return {
    totalValue,
    totalInvestment,
    totalReturns,
    totalReturnsPercentage,
    assetGroups
  };
};

export { getAssetIcon };
