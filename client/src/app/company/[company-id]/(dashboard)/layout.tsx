"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/modules/layout/Sidebar";
import { Navbar } from "@/components/modules/layout/Navbar";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function CompanyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const companyId = typeof params["company-id"] === "string" ? params["company-id"] : "12983hufiu42";
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-surface flex">
        {/* Dark Categorized Sidebar on the left with StoreInfo at bottom */}
        <Sidebar
          companyId={companyId}
          companyName="Acme Industrial Supplies"
          userRole="Sales Representative"
          companyStatus="Online"
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
