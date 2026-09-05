"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/modules/layout/Navbar";
import { StoreGeneralSettingsCard } from "@/components/modules/settings/StoreGeneralSettingsCard";
import { StoreAddressSettingsCard } from "@/components/modules/settings/StoreAddressSettingsCard";
import { DiscountTiersSettingsCard } from "@/components/modules/settings/DiscountTiersSettingsCard";
import { CompanySettings } from "@/types/settings";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Save } from "lucide-react";

const INITIAL_SETTINGS: CompanySettings = {
  storeName: "Acme Industrial Supplies",
  currency: "USD",
  currencySymbol: "$",
  address: {
    street: "100 Industrial Parkway, Suite 400",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400001",
    country: "India",
  },
  discountTiers: {
    goldPercent: 15,
    silverPercent: 10,
    bronzePercent: 5,
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings>(INITIAL_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const mockUser = {
    fullName: "Alex Rivera",
    email: "alex.rivera@example.com",
    platformRole: "User",
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);
      setNotification("Company settings and discount tier thresholds updated successfully.");
      setTimeout(() => setNotification(null), 4000);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar variant="company" user={mockUser} />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-8">
        {/* Header Section */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage company configuration, store defaults, currency, and discount tier thresholds.
          </p>
        </div>

        {notification && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-success flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-8">
          {/* General Store Identity & Currency */}
          <StoreGeneralSettingsCard
            storeName={settings.storeName}
            currency={settings.currency}
            onChangeStoreName={(storeName) =>
              setSettings((prev) => ({ ...prev, storeName }))
            }
            onChangeCurrency={(currency) =>
              setSettings((prev) => ({ ...prev, currency }))
            }
          />

          {/* Customer Discount Tiers */}
          <DiscountTiersSettingsCard
            tiers={settings.discountTiers}
            onChangeTiers={(discountTiers) =>
              setSettings((prev) => ({ ...prev, discountTiers }))
            }
          />

          {/* Physical Store Address */}
          <StoreAddressSettingsCard
            address={settings.address}
            onChangeAddress={(address) =>
              setSettings((prev) => ({ ...prev, address }))
            }
          />

          {/* Bottom Save Action */}
          <div className="flex items-center justify-end pt-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSaving}
              loadingText="Saving Settings..."
              leftIcon={<Save className="w-4 h-4" />}
              className="px-6 py-3 font-semibold rounded-xl shadow-xs"
            >
              Save Settings
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
