import React from "react";
import { MapPin } from "lucide-react";
import { clsx } from "clsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { StoreAddress } from "@/types/settings";

export interface StoreAddressSettingsCardProps {
  address: StoreAddress;
  onChangeAddress: (updatedAddress: StoreAddress) => void;
  className?: string;
}

export const StoreAddressSettingsCard: React.FC<StoreAddressSettingsCardProps> = ({
  address,
  onChangeAddress,
  className,
}) => {
  const handleChangeField = (field: keyof StoreAddress, val: string) => {
    onChangeAddress({
      ...address,
      [field]: val,
    });
  };

  return (
    <Card className={clsx("rounded-2xl border border-border bg-card shadow-xs", className)}>
      <CardHeader className="px-6 py-5 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-brand-600 shrink-0" />
          <CardTitle className="text-lg font-bold text-text-primary">
            Store Address
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-text-secondary mt-1">
          Physical location and official business address used on invoices and delivery documents.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Street Address */}
        <Input
          label="Street Address"
          type="text"
          placeholder="100 Industrial Parkway, Suite 400"
          value={address.street}
          onChange={(e) => handleChangeField("street", e.target.value)}
        />

        {/* City & State Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="City"
            type="text"
            placeholder="Mumbai"
            value={address.city}
            onChange={(e) => handleChangeField("city", e.target.value)}
          />
          <Input
            label="State / Province"
            type="text"
            placeholder="Maharashtra"
            value={address.state}
            onChange={(e) => handleChangeField("state", e.target.value)}
          />
        </div>

        {/* Postal Code & Country Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="ZIP / Postal Code"
            type="text"
            placeholder="400001"
            value={address.postalCode}
            onChange={(e) => handleChangeField("postalCode", e.target.value)}
          />
          <Input
            label="Country"
            type="text"
            placeholder="India"
            value={address.country}
            onChange={(e) => handleChangeField("country", e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default StoreAddressSettingsCard;
