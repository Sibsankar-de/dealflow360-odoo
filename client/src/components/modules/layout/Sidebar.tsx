"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppLogo } from "@/components/ui/AppLogo";
import { StoreInfo } from "./StoreInfo";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Users,
  Package,
  Warehouse,
  ShoppingBag,
  RefreshCw,
  Receipt,
  Activity,
  HelpCircle,
  Settings,
  PanelLeftClose,
  ShieldCheck,
} from "lucide-react";

export interface SidebarProps {
  companyId: string;
  companyName?: string;
  userRole?: string;
  companyStatus?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  companyId,
  companyName = "DealFlow360",
  userRole = "Sales Representative",
  companyStatus = "Active",
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  className = "",
}) => {
  const pathname = usePathname() || "";
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const isCollapsed =
    controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  const NAV_SECTIONS = [
    {
      title: "OVERVIEW",
      items: [
        {
          label: "Dashboard",
          href: `/company/${companyId}/app/dashboard`,
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
      ],
    },
    {
      title: "SALES",
      items: [
        {
          label: "Deals",
          href: `/company/${companyId}/app/deals`,
          icon: <Briefcase className="w-4 h-4" />,
        },
        {
          label: "Quotations",
          href: `/company/${companyId}/app/quotations`,
          icon: <FileText className="w-4 h-4" />,
        },
        {
          label: "Customers",
          href: `/company/${companyId}/app/customers`,
          icon: <Users className="w-4 h-4" />,
        },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        {
          label: "Products",
          href: `/company/${companyId}/app/products`,
          icon: <ShoppingBag className="w-4 h-4" />,
        },
        {
          label: "Warehouses",
          href: `/company/${companyId}/app/warehouses`,
          icon: <Warehouse className="w-4 h-4" />,
        },
        {
          label: "Fulfillment",
          href: `/company/${companyId}/app/fulfillment`,
          icon: <Package className="w-4 h-4" />,
        },
        {
          label: "Subscriptions",
          href: `/company/${companyId}/app/subscriptions`,
          icon: <RefreshCw className="w-4 h-4" />,
        },
        {
          label: "Invoices",
          href: `/company/${companyId}/app/invoices`,
          icon: <Receipt className="w-4 h-4" />,
        },
      ],
    },
    {
      title: "INSIGHTS",
      items: [
        {
          label: "Deal Health",
          href: `/company/${companyId}/app/deal-health`,
          icon: <Activity className="w-4 h-4" />,
        },
      ],
    },
    {
      title: "TEAM",
      items: [
        {
          label: "Access Control",
          href: `/company/${companyId}/app/access-control`,
          icon: <ShieldCheck className="w-4 h-4" />,
        },
      ],
    },
  ];

  return (
    <aside
      className={`bg-navy-950 text-white flex flex-col justify-between border-r border-navy-800/80 shrink-0 select-none min-h-screen transition-all duration-200 ${
        isCollapsed ? "w-16" : "w-64"
      } ${className}`}
    >
      {/* Top Header & Main Navigation */}
      <div className="flex flex-col">
        {/* Header with AppLogo & Collapse Button */}
        <div
          className={`h-16 px-4 flex items-center border-b border-navy-900 ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          {isCollapsed ? (
            <button
              type="button"
              onClick={handleToggle}
              title="Expand sidebar"
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <AppLogo showText={false} size="sm" textColor="white" />
            </button>
          ) : (
            <>
              <Link
                href={`/company/${companyId}/app/quotations`}
                className="flex items-center min-w-0 hover:opacity-90 transition-opacity"
              >
                <AppLogo
                  name="DealFlow360"
                  size="sm"
                  textColor="white"
                  showText={true}
                />
              </Link>
              <button
                type="button"
                onClick={handleToggle}
                title="Collapse sidebar"
                className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-navy-900 transition-colors cursor-pointer shrink-0"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Categorized Nav Items */}
        <nav className="p-3 space-y-5 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              {!isCollapsed && (
                <h2 className="px-3 text-[10px] font-bold text-text-muted tracking-wider uppercase">
                  {section.title}
                </h2>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.label : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        isCollapsed ? "justify-center px-0" : ""
                      } ${
                        isActive
                          ? "bg-brand-600/20 text-brand-500 border border-brand-500/30 font-semibold"
                          : "text-text-muted hover:text-white hover:bg-navy-900"
                      }`}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Footer Section: Help & Support, Settings, and StoreInfo */}
      <div className="p-3 border-t border-navy-900 space-y-3">
        {/* Secondary Utility Links */}
        <div className="space-y-0.5">
          <Link
            href={`/company/${companyId}/app/help`}
            title={isCollapsed ? "Help & Support" : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-text-muted hover:text-white hover:bg-navy-900 transition-colors ${
              isCollapsed ? "justify-center px-0" : ""
            }`}
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Help & Support</span>}
          </Link>
          <Link
            href={`/company/${companyId}/app/settings`}
            title={isCollapsed ? "Settings" : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-text-muted hover:text-white hover:bg-navy-900 transition-colors ${
              isCollapsed ? "justify-center px-0" : ""
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </Link>
        </div>

        {/* StoreInfo component at the bottom of the sidebar */}
        {!isCollapsed ? (
          <div className="pt-2 border-t border-navy-900/80">
            <StoreInfo
              companyName={companyName}
              userRole={userRole}
              status={companyStatus}
              className="px-1 text-white"
            />
          </div>
        ) : (
          <div className="pt-2 border-t border-navy-900/80 flex justify-center">
            <StoreInfo
              companyName={companyName}
              userRole={userRole}
              status={companyStatus}
              className="justify-center"
            />
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
