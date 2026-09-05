"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppLogo } from "@/components/ui/AppLogo";
import { Badge } from "@/components/ui/Badge";
import { UserAvatarMenu } from "@/components/modules/layout/UserAvatarMenu";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { useGetCompanyByIdQuery } from "@/store/features/company/companyApi";
import { useAuth } from "@/context/AuthContext";
import { Building2 } from "lucide-react";

export default function CustomerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string" ? params["company-id"] : "";

  const { user, logout } = useAuth();
  const { data: companyData } = useGetCompanyByIdQuery(companyId, {
    skip: !companyId,
  });

  const company = companyData?.data?.company;
  const companyName = company?.name || "DealFlow360 Workspace";

  const userData = user
    ? {
        fullName: user.userName,
        email: user.email,
        platformRole: "Customer",
      }
    : {
        fullName: "Customer",
        email: "",
        platformRole: "Customer",
      };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-surface flex flex-col">
        {/* Customer Portal Top Header */}
        <header className="w-full bg-card border-b border-border sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            {/* Left branding */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <Link
                href="/profile"
                className="hover:opacity-90 transition-opacity flex items-center"
              >
                <AppLogo size="sm" textColor="black" />
              </Link>

              <div className="h-5 w-px bg-border hidden sm:block" />

              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-brand-50 rounded-lg text-brand-600 hidden sm:flex">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text-primary text-sm truncate max-w-[180px] sm:max-w-[260px]">
                    {companyName}
                  </span>
                  <Badge variant="purple" className="text-[11px] font-semibold">
                    Customer Portal
                  </Badge>
                </div>
              </div>
            </div>

            {/* Right User Avatar */}
            <div className="flex items-center gap-3 shrink-0">
              <UserAvatarMenu user={userData} onLogout={logout} />
            </div>
          </div>
        </header>

        {/* Customer Portal Main Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
