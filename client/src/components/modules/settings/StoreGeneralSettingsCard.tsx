import React from "react";
import { Store, DollarSign } from "lucide-react";
import { clsx } from "clsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export interface StoreGeneralSettingsCardProps {
  storeName: string;
  currency: string;
  onChangeStoreName: (name: string) => void;
  onChangeCurrency: (currency: string) => void;
  className?: string;
}

const CURRENCY_OPTIONS = [
  { code: "USD", symbol: "$", label: "USD ($) - US Dollar" },
  { code: "INR", symbol: "₹", label: "INR (₹) - Indian Rupee" },
  { code: "EUR", symbol: "€", label: "EUR (€) - Euro" },
  { code: "GBP", symbol: "£", label: "GBP (£) - British Pound" },
];

export const StoreGeneralSettingsCard: React.FC<StoreGeneralSettingsCardProps> = ({
  storeName,
  currency,
  onChangeStoreName,
  onChangeCurrency,
  className,
}) => {
  return (
    <Card className={clsx("rounded-2xl border border-border bg-card shadow-xs", className)}>
      <CardHeader className="px-6 py-5 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-brand-600 shrink-0" />
          <CardTitle className="text-lg font-bold text-text-primary">
            General Store Settings
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-text-secondary mt-1">
          Configure primary store identity and default transaction currency.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Store Name Input */}
        <Input
          label="Store / Company Name"
          type="text"
          placeholder="Acme Industrial Supplies"
          value={storeName}
          onChange={(e) => onChangeStoreName(e.target.value)}
          required
        />

        {/* Currency Selector */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary select-none flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-text-muted" />
            <span>Default Operating Currency</span>
          </label>
          <select
            value={currency}
            onChange={(e) => onChangeCurrency(e.target.value)}
            className="w-full px-3.5 py-2 text-sm font-medium text-text-primary bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all cursor-pointer"
          >
            {CURRENCY_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </CardContent>
    </Card>
  );
};

export default StoreGeneralSettingsCard;
