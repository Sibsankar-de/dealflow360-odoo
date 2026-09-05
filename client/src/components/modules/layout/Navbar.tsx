"use client";

import React from "react";
import Link from "next/link";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { UserAvatarMenu } from "./UserAvatarMenu";
import { Badge } from "@/components/ui/Badge";
import {
  LayoutDashboard,
  FileText,
  Truck,
  Receipt,
  Package,
  Users,
} from "lucide-react";

export type NavbarVariant = "profile" | "company";

export interface NavbarNavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export interface NavbarProps {
  variant?: NavbarVariant;
  user: {
    fullName: string;
    email: string;
    platformRole?: string;
  };
  companyName?: string;
  activePath?: string;
  onLogout?: () => void;
  className?: string;
}

const DEFAULT_COMPANY_NAV_ITEMS: NavbarNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Quotations", href: "/quotations", icon: <FileText className="w-4 h-4" /> },
  { label: "Fulfillment", href: "/fulfillment", icon: <Truck className="w-4 h-4" /> },
  { label: "Invoices", href: "/invoices", icon: <Receipt className="w-4 h-4" /> },
  { label: "Products", href: "/products", icon: <Package className="w-4 h-4" /> },
  { label: "Team", href: "/team", icon: <Users className="w-4 h-4" /> },
];

export const Navbar: React.FC<NavbarProps> = ({
  variant = "company",
  user,
  companyName,
  activePath = "",
  onLogout,
  className = "",
}) => {
  return (
    <header className={`w-full bg-card border-b border-border sticky top-0 z-40 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Side: CompanyLogo and Context */}
        <div className="flex items-center gap-6">
          <Link
            href={variant === "profile" ? "/profile" : "/dashboard"}
            className="hover:opacity-90 transition-opacity flex items-center"
          >
            <CompanyLogo size="md" />
          </Link>

          {/* Company Context Badge (Company View) */}
          {variant === "company" && companyName && (
            <div className="hidden md:flex items-center gap-2 border-l border-border pl-4">
              <span className="text-xs text-text-muted">Company:</span>
              <Badge variant="secondary" className="font-semibold text-xs text-text-primary">
                {companyName}
              </Badge>
            </div>
          )}
        </div>

        {/* Center: Navigation Options (Company View) */}
        {variant === "company" && (
          <nav className="hidden lg:flex items-center gap-1">
            {DEFAULT_COMPANY_NAV_ITEMS.map((item) => {
              const isActive = activePath.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-brand-50 text-brand-700 font-semibold"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface"
                  }`}
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Side: User Avatar with Dropdown navigation & Logout */}
        <div className="flex items-center gap-3">
          <UserAvatarMenu user={user} onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
