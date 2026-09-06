"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppLogo } from "@/components/ui/AppLogo";
import { UserAvatarMenu } from "./UserAvatarMenu";
import { useAuth } from "@/context/AuthContext";
import { StoreInfo } from "./StoreInfo";
import { Briefcase, CreditCard, Receipt } from "lucide-react";

export type NavbarVariant = "profile" | "company" | "customer";

export interface NavbarProps {
  variant?: NavbarVariant;
  companyId?: string;
  companyInfo?: {
    companyName: string;
    userRole?: string;
    status?: string;
  };
  user?: {
    fullName: string;
    email: string;
    platformRole?: string;
  };
  onLogout?: () => void;
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  variant = "company",
  companyId,
  companyInfo,
  user: propUser,
  onLogout: propOnLogout,
  className = "",
}) => {
  const pathname = usePathname() || "";
  const { user: authUser, logout: authLogout } = useAuth();

  const user = propUser || (authUser ? {
    fullName: authUser.userName,
    email: authUser.email,
    platformRole: authUser.role,
  } : {
    fullName: "User",
    email: "user@example.com",
    platformRole: "User",
  });

  const onLogout = propOnLogout || authLogout;

  const customerNavLinks = companyId
    ? [
        {
          label: "Deals",
          href: `/company/${companyId}/customer`,
          icon: <Briefcase className="w-4 h-4" />,
          isActive:
            pathname === `/company/${companyId}/customer` ||
            pathname.startsWith(`/company/${companyId}/customer/deals`),
        },
        {
          label: "Subscriptions",
          href: `/company/${companyId}/customer/subscriptions`,
          icon: <CreditCard className="w-4 h-4" />,
          isActive: pathname.startsWith(
            `/company/${companyId}/customer/subscriptions`
          ),
        },
        {
          label: "Invoices",
          href: `/company/${companyId}/customer/invoices`,
          icon: <Receipt className="w-4 h-4" />,
          isActive: pathname.startsWith(
            `/company/${companyId}/customer/invoices`
          ),
        },
      ]
    : [];

  return (
    <header
      className={`w-full bg-card border-b border-border sticky top-0 z-40 ${className}`}
    >
      <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left Side: Logo & Customer Nav Links */}
        <div className="flex items-center gap-6 shrink-0">
          {(variant === "profile" || variant === "customer") && (
            <Link
              href="/profile"
              className="hover:opacity-90 transition-opacity flex items-center"
            >
              <AppLogo size="md" textColor="black" />
            </Link>
          )}

          {/* Customer Group Navigation Options: Deals, Subscriptions, Invoices */}
          {variant === "customer" && customerNavLinks.length > 0 && (
            <nav className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-border">
              {customerNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    link.isActive
                      ? "bg-brand-50 text-brand-600 border border-brand-200"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface"
                  }`}
                >
                  <span className="shrink-0">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* Right Side: CompanyInfo (if customer) + User Avatar with Dropdown navigation & Logout */}
        <div className="flex items-center gap-4 shrink-0">
          {companyInfo && (
            <StoreInfo
              companyName={companyInfo.companyName}
              userRole={companyInfo.userRole || "Customer"}
              status={companyInfo.status || "Active"}
              theme="light"
            />
          )}
          <UserAvatarMenu user={user} onLogout={onLogout} />
        </div>
      </div>

      {/* Mobile Customer Navigation Bar */}
      {variant === "customer" && customerNavLinks.length > 0 && (
        <div className="sm:hidden flex items-center justify-around px-2 py-2 border-t border-border bg-card">
          {customerNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                link.isActive
                  ? "bg-brand-50 text-brand-600 border border-brand-200"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface"
              }`}
            >
              <span className="shrink-0">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

export default Navbar;
