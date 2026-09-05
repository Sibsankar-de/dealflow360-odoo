"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/modules/layout/Sidebar";
import { Navbar } from "@/components/modules/layout/Navbar";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

import { useGetCompanyByIdQuery } from "@/store/features/company/companyApi";
import { useAppDispatch } from "@/store";
import { setCurrentCompany } from "@/store/features/company/companySlice";

export default function CompanyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const companyId = typeof params["company-id"] === "string" ? params["company-id"] : "";
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const dispatch = useAppDispatch();

  const { data: companyData } = useGetCompanyByIdQuery(companyId, {
    skip: !companyId,
  });

  const company = companyData?.data?.company;

  React.useEffect(() => {
    if (company) {
      dispatch(setCurrentCompany(company));
    }
  }, [company, dispatch]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-surface flex">
        {/* Dark Categorized Sidebar on the left with StoreInfo at bottom */}
        <Sidebar
          companyId={companyId}
          companyName={company?.name || "DealFlow360"}
          userRole={company?.userRole || "Company Member"}
          companyStatus={company?.status || "Active"}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-surface">
          {/* Top Navbar with User Avatar Menu */}
          <Navbar
            variant="company"
          />

          {/* Page Viewport */}
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
