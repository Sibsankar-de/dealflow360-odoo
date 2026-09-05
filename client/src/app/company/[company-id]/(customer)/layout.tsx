"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/modules/layout/Navbar";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { useGetCompanyByIdQuery } from "@/store/features/company/companyApi";

export default function CustomerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string" ? params["company-id"] : "";

  const { data: companyData } = useGetCompanyByIdQuery(companyId, {
    skip: !companyId,
  });

  const company = companyData?.data?.company;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-surface flex flex-col">
        {/* Top Navbar with AppLogo on left and CompanyInfo before Avatar icon */}
        <Navbar
          variant="customer"
          companyInfo={
            company
              ? {
                  companyName: company.name,
                  userRole: "Customer",
                  status: company.status || "Active",
                }
              : undefined
          }
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
