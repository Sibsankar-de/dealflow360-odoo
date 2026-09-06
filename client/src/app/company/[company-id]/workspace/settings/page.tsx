"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CurrencySelector } from "@/components/ui/CurrencySelector";
import {
  useGetCompanyByIdQuery,
  useGetCompanySettingsQuery,
  useUpdateCompanyMutation,
  useUpdateCompanySettingsMutation,
} from "@/store/features/company/companyApi";
import { Building2, Save, ShieldCheck, DollarSign, Percent, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function CompanySettingsPage() {
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string" ? params["company-id"] : "";

  const { data: companyData, isLoading: isCompanyLoading } = useGetCompanyByIdQuery(companyId, {
    skip: !companyId,
  });

  const { data: settingsData, isLoading: isSettingsLoading } = useGetCompanySettingsQuery(companyId, {
    skip: !companyId,
  });

  const [updateCompany, { isLoading: isUpdatingCompany }] = useUpdateCompanyMutation();
  const [updateCompanySettings, { isLoading: isUpdatingSettings }] = useUpdateCompanySettingsMutation();

  const company = companyData?.data?.company;
  const settings = settingsData?.data?.settings;

  const [companyName, setCompanyName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [country, setCountry] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [bronzeDiscount, setBronzeDiscount] = useState<number | string>("");
  const [silverDiscount, setSilverDiscount] = useState<number | string>("");
  const [goldDiscount, setGoldDiscount] = useState<number | string>("");

  const [notification, setNotification] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (company) {
      setCompanyName(company.name || "");
      setCurrency(company.currency || "USD");
      setCountry(company.country || "");
      setAddressLine(company.addressLine || "");
      setPostalCode(company.postalCode || "");
    }
  }, [company]);

  React.useEffect(() => {
    if (settings?.customerDiscountTier) {
      setBronzeDiscount(settings.customerDiscountTier.BRONZE ?? "");
      setSilverDiscount(settings.customerDiscountTier.SILVER ?? "");
      setGoldDiscount(settings.customerDiscountTier.GOLD ?? "");
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setNotification(null);

    try {
      await updateCompany({
        companyId,
        data: {
          name: companyName.trim(),
          currency,
          country: country.trim() || undefined,
          postalCode: postalCode.trim() || undefined,
          addressLine: addressLine.trim() || undefined,
        },
      }).unwrap();

      const discountTierPayload: {
        BRONZE?: number;
        SILVER?: number;
        GOLD?: number;
      } = {};

      if (bronzeDiscount !== "") discountTierPayload.BRONZE = Number(bronzeDiscount);
      if (silverDiscount !== "") discountTierPayload.SILVER = Number(silverDiscount);
      if (goldDiscount !== "") discountTierPayload.GOLD = Number(goldDiscount);

      await updateCompanySettings({
        companyId,
        data: {
          customerDiscountTier: discountTierPayload,
        },
      }).unwrap();

      toast.success("Company profile and discount tier settings updated successfully.");
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to update company settings";
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  const isLoading = isCompanyLoading || isSettingsLoading;
  const isSaving = isUpdatingCompany || isUpdatingSettings;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-text-muted">
        <Building2 className="w-8 h-8 animate-pulse mx-auto mb-3 text-brand-600" />
        <p className="text-sm">Loading company settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Company Settings
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage company profile, base currency, and customer tier discount configurations.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-danger flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-danger shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-600" />
              <CardTitle>Organization Profile</CardTitle>
            </div>
            <CardDescription>
              Basic legal and public operational details for this company workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
              <CurrencySelector
                label="Base Currency"
                value={currency}
                onChange={(val) => setCurrency(val)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. United States"
              />
              <Input
                label="Postal / ZIP Code"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="e.g. 94105"
              />
            </div>

            <Input
              label="Street Address"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              placeholder="e.g. 100 Main Street, Suite 400"
            />
          </CardContent>
        </Card>

        {/* Customer Discount Tiers Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-brand-600" />
              <CardTitle>Customer Discount Tiers</CardTitle>
            </div>
            <CardDescription>
              Set default percentage discounts for Bronze, Silver, and Gold customer classifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-surface rounded-xl border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wide">
                    Bronze Tier
                  </span>
                  <span className="text-[10px] font-semibold text-text-muted bg-card px-2 py-0.5 rounded border border-border">
                    Standard
                  </span>
                </div>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="0"
                  value={bronzeDiscount}
                  onChange={(e) => setBronzeDiscount(e.target.value)}
                  rightIcon={<Percent className="w-3.5 h-3.5 text-text-muted" />}
                />
              </div>

              <div className="p-4 bg-surface rounded-xl border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wide">
                    Silver Tier
                  </span>
                  <span className="text-[10px] font-semibold text-info bg-card px-2 py-0.5 rounded border border-border">
                    Intermediate
                  </span>
                </div>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="0"
                  value={silverDiscount}
                  onChange={(e) => setSilverDiscount(e.target.value)}
                  rightIcon={<Percent className="w-3.5 h-3.5 text-text-muted" />}
                />
              </div>

              <div className="p-4 bg-surface rounded-xl border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wide">
                    Gold Tier
                  </span>
                  <span className="text-[10px] font-semibold text-warning bg-card px-2 py-0.5 rounded border border-border">
                    Premium
                  </span>
                </div>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="0"
                  value={goldDiscount}
                  onChange={(e) => setGoldDiscount(e.target.value)}
                  rightIcon={<Percent className="w-3.5 h-3.5 text-text-muted" />}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commercial Policies & Rules */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple" />
              <CardTitle>Approval Workflows & Governance</CardTitle>
            </div>
            <CardDescription>
              Control high-risk quotation thresholds and automated manager approvals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-surface rounded-xl border border-border">
                <p className="text-xs font-semibold text-text-primary">
                  Manager Approval Discount Threshold
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  Quotations with discounts exceeding 15% require Sales Manager review.
                </p>
              </div>
              <div className="p-4 bg-surface rounded-xl border border-border">
                <p className="text-xs font-semibold text-text-primary">
                  Finance Escalation Threshold
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  Deals over $50,000 or discounts over 25% require Finance Manager approval.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            isLoading={isSaving}
            loadingText="Saving Settings..."
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}

