import { useState, useEffect } from 'react';
import { Search, User, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUserAssets } from "@/lib/firestore";
import { AddAssetDialog } from "@/components/portfolio/AddAssetDialog";
import { PortfolioSummaryCard } from "@/components/portfolio/PortfolioSummaryCard";
import { AssetGroupSection } from "@/components/portfolio/AssetGroupSection";
import { PerformanceChart } from "@/components/portfolio/PerformanceChart";
import { AssetAllocationChart } from "@/components/portfolio/AssetAllocationChart";
import { Asset, AssetType, AssetGroup } from "@/types/portfolio";
import { toast } from "sonner";
import ProfileMenu from '@/components/ProfileMenu';

const Portfolio = () => {
  const [userAssets, setUserAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddAssetDialogOpen, setIsAddAssetDialogOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAssets = async () => {
      if (user) {
        try {
          setLoading(true);
          const assets = await getUserAssets(user.uid);
          setUserAssets(assets);
        } catch (error) {
          console.error("Error fetching assets:", error);
          toast("Error fetching assets. Please try again.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserAssets();
  }, [user]);

  const totalPortfolioValue = userAssets.reduce((total, asset) => total + asset.value, 0);
  const totalInvestment = userAssets.reduce((total, asset) => total + (asset.initialInvestment || asset.value), 0);
  const totalReturns = totalPortfolioValue - totalInvestment;
  const totalReturnsPercentage = totalInvestment > 0 ? (totalReturns / totalInvestment) * 100 : 0;
  
  const portfolioSummary = {
    totalValue: totalPortfolioValue,
    totalInvestment: totalInvestment,
    totalReturns: totalReturns,
    totalReturnsPercentage: totalReturnsPercentage,
    assetGroups: []
  };

  const assetGroups = userAssets.reduce((groups, asset) => {
    const type = asset.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(asset);
    return groups;
  }, {} as Record<AssetType, Asset[]>);

  const formattedAssetGroups = Object.entries(assetGroups).map(([type, assets]) => {
    const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
    const initialInvestment = assets.reduce((sum, asset) => sum + (asset.initialInvestment || asset.value), 0);
    const returns = totalValue - initialInvestment;
    const returnsPercentage = initialInvestment > 0 ? (returns / initialInvestment) * 100 : 0;
    const allocation = totalPortfolioValue > 0 ? (totalValue / totalPortfolioValue) * 100 : 0;
    
    let color = '#8B5CF6';
    switch(type) {
      case 'stock': color = '#8B5CF6'; break;
      case 'mutualFund': color = '#10B981'; break;
      case 'crypto': color = '#F59E0B'; break;
      case 'gold': color = '#F59E0B'; break;
      case 'realEstate': color = '#EF4444'; break;
      case 'fd': color = '#3B82F6'; break;
      case 'pf': color = '#6366F1'; break;
    }
    
    return {
      type: type as AssetType,
      label: type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1'),
      assets,
      totalValue,
      returns,
      allocation,
      returnsPercentage,
      color
    } as AssetGroup;
  });

  portfolioSummary.assetGroups = formattedAssetGroups;

  const handleAddAsset = () => {
    setIsAddAssetDialogOpen(true);
  };

  const handleAssetAdded = async () => {
    if (user) {
      try {
        setLoading(true);
        const assets = await getUserAssets(user.uid);
        setUserAssets(assets);
      } catch (error) {
        console.error("Error refreshing assets:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleProfileClick = () => {
    setIsProfileMenuOpen(prev => !prev);
  };

  const closeProfileMenu = () => {
    setIsProfileMenuOpen(false);
  };

  const handleOutsideClick = (e: React.MouseEvent) => {
    if (isProfileMenuOpen) {
      closeProfileMenu();
    }
  };

  return (
    <div className="min-h-screen pb-20" onClick={handleOutsideClick}>
      <nav className="fixed top-0 w-full backdrop-blur-lg border-b z-50">
        <div className="container mx-auto flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary">InvestAI</h1>
            <Badge variant="outline" className="ml-2">Portfolio</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className="relative h-10 w-10 rounded-full"
              onClick={handleProfileClick}
            >
              <User className="h-5 w-5" />
            </Button>
            {isProfileMenuOpen && (
              <ProfileMenu 
                isOpen={isProfileMenuOpen} 
                onClose={closeProfileMenu} 
              />
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">My Portfolio</h1>
              <p className="opacity-60 mt-1">Track and manage your investments</p>
            </div>
            <Button onClick={handleAddAsset} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Asset
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <PortfolioSummaryCard summary={portfolioSummary} />
            </div>
            <div>
              <AssetAllocationChart assetGroups={formattedAssetGroups} />
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4">Portfolio Performance</h2>
            <PerformanceChart assetGroups={formattedAssetGroups} />
          </div>

          {formattedAssetGroups.map((group) => (
            <AssetGroupSection 
              key={group.type} 
              group={group}
            />
          ))}

          {userAssets.length === 0 && !loading && (
            <div className="glass-card p-8 text-center">
              <h3 className="text-xl font-medium mb-2">No assets yet</h3>
              <p className="opacity-60 mb-4">Add your first investment to start tracking your portfolio</p>
              <Button onClick={handleAddAsset}>Add Your First Asset</Button>
            </div>
          )}
        </div>
      </div>

      {isAddAssetDialogOpen && (
        <AddAssetDialog
          open={isAddAssetDialogOpen}
          onOpenChange={setIsAddAssetDialogOpen}
          onAssetAdded={handleAssetAdded}
        />
      )}
    </div>
  );
};

export default Portfolio;
