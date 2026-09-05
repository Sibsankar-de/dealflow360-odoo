import React from "react";
import { Percent, Award } from "lucide-react";
import { clsx } from "clsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { DiscountTiers } from "@/types/settings";

export interface DiscountTiersSettingsCardProps {
  tiers: DiscountTiers;
  onChangeTiers: (updatedTiers: DiscountTiers) => void;
  className?: string;
}

export const DiscountTiersSettingsCard: React.FC<DiscountTiersSettingsCardProps> = ({
  tiers,
  onChangeTiers,
  className,
}) => {
  const handlePercentChange = (tierKey: keyof DiscountTiers, valStr: string) => {
    const parsed = parseFloat(valStr);
    const newPercent = isNaN(parsed) ? 0 : Math.max(0, Math.min(100, parsed));

    onChangeTiers({
      ...tiers,
      [tierKey]: newPercent,
    });
  };

  return (
    <Card className={clsx("rounded-2xl border border-border bg-card shadow-xs", className)}>
      <CardHeader className="px-6 py-5 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500 shrink-0" />
          <CardTitle className="text-lg font-bold text-text-primary">
            Customer Discount Tiers
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-text-secondary mt-1">
          Set maximum automated discount thresholds for customer loyalty tiers.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Gold Tier Card */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-amber-900">Gold Tier</span>
              <Badge variant="warning" className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-[10px]">
                PREMIUM
              </Badge>
            </div>
            <Input
              label="Max Discount (%)"
              type="number"
              min="0"
              max="100"
              step="0.5"
              placeholder="15"
              value={tiers.goldPercent.toString()}
              onChange={(e) => handlePercentChange("goldPercent", e.target.value)}
              rightIcon={<Percent className="w-3.5 h-3.5 text-text-muted" />}
            />
          </div>

          {/* Silver Tier Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">Silver Tier</span>
              <Badge variant="secondary" className="bg-slate-200 text-slate-800 border-slate-300 font-bold text-[10px]">
                STANDARD
              </Badge>
            </div>
            <Input
              label="Max Discount (%)"
              type="number"
              min="0"
              max="100"
              step="0.5"
              placeholder="10"
              value={tiers.silverPercent.toString()}
              onChange={(e) => handlePercentChange("silverPercent", e.target.value)}
              rightIcon={<Percent className="w-3.5 h-3.5 text-text-muted" />}
            />
          </div>

          {/* Bronze Tier Card */}
          <div className="p-4 rounded-xl border border-amber-700/20 bg-orange-50/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-orange-900">Bronze Tier</span>
              <Badge variant="outline" className="bg-orange-100/60 text-orange-800 border-orange-200 font-bold text-[10px]">
                BASIC
              </Badge>
            </div>
            <Input
              label="Max Discount (%)"
              type="number"
              min="0"
              max="100"
              step="0.5"
              placeholder="5"
              value={tiers.bronzePercent.toString()}
              onChange={(e) => handlePercentChange("bronzePercent", e.target.value)}
              rightIcon={<Percent className="w-3.5 h-3.5 text-text-muted" />}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DiscountTiersSettingsCard;
