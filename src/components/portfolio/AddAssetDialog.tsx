
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { AssetType } from "@/types/portfolio";
import { addUserAsset, NewAsset } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AddAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssetAdded: () => void;
}

const assetTypes: { value: AssetType; label: string }[] = [
  { value: "stock", label: "Stocks" },
  { value: "mutualFund", label: "Mutual Funds" },
  { value: "pf", label: "Provident Fund" },
  { value: "fd", label: "Fixed Deposit" },
  { value: "gold", label: "Gold" },
  { value: "realEstate", label: "Real Estate" },
  { value: "crypto", label: "Cryptocurrency" },
  { value: "other", label: "Other" },
];

export function AddAssetDialog({ open, onOpenChange, onAssetAdded }: AddAssetDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<NewAsset, 'type'> & { type: AssetType | '' }>({
    name: "",
    type: "",
    value: 0,
    initialInvestment: 0,
    purchaseDate: undefined,
    notes: "",
  });
  const [date, setDate] = useState<Date | undefined>(undefined);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newValue = name === "value" || name === "initialInvestment" ? parseFloat(value) || 0 : value;
    
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleTypeChange = (value: AssetType) => {
    setFormData((prev) => ({
      ...prev,
      type: value,
    }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setDate(date);
    setFormData((prev) => ({
      ...prev,
      purchaseDate: date ? format(date, "yyyy-MM-dd") : undefined,
    }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast("Authentication error. You must be logged in to add assets");
      return;
    }

    if (!formData.name || !formData.type || formData.value <= 0) {
      toast("Validation error. Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const newAsset: NewAsset = {
        name: formData.name,
        type: formData.type as AssetType,
        value: formData.value,
        initialInvestment: formData.initialInvestment || formData.value,
        purchaseDate: formData.purchaseDate,
        notes: formData.notes,
      };

      await addUserAsset(user.uid, newAsset);
      
      toast(`${formData.name} has been added to your portfolio`);
      
      onAssetAdded();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: "",
        type: "",
        value: 0,
        initialInvestment: 0,
        purchaseDate: undefined,
        notes: "",
      });
      setDate(undefined);
    } catch (error) {
      console.error(error);
      toast("Failed to add asset. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] glass-card">
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Asset Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Enter asset name"
              value={formData.name}
              onChange={handleChange}
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Asset Type</Label>
            <Select value={formData.type} onValueChange={handleTypeChange}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="Select asset type" />
              </SelectTrigger>
              <SelectContent>
                {assetTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="value">Current Value (₹)</Label>
            <Input
              id="value"
              name="value"
              type="number"
              placeholder="0"
              value={formData.value || ""}
              onChange={handleChange}
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="initialInvestment">Initial Investment (₹)</Label>
            <Input
              id="initialInvestment"
              name="initialInvestment"
              type="number"
              placeholder="0"
              value={formData.initialInvestment || ""}
              onChange={handleChange}
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="grid gap-2">
            <Label>Purchase Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal bg-white/5 border-white/10",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateChange}
                  initialFocus
                  className="bg-primary-foreground"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Add any notes about this asset"
              value={formData.notes || ""}
              onChange={handleChange}
              className="bg-white/5 border-white/10"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding..." : "Add Asset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
