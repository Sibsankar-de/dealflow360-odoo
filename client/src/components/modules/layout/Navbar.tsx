"use client";

import React from "react";
import Link from "next/link";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { UserAvatarMenu } from "./UserAvatarMenu";
import { StoreInfo } from "./StoreInfo";

export type NavbarVariant = "profile" | "company";

export interface NavbarProps {
  variant?: NavbarVariant;
  user: {
    fullName: string;
    email: string;
    platformRole?: string;
  };
  companyId?: string;
  companyName?: string;
  userRole?: string;
  companyStatus?: string;
  onLogout?: () => void;
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  variant = "company",
  user,
  companyId = "12983hufiu42",
  companyName = "Acme Industrial Supplies",
  userRole = "Company Admin",
  companyStatus = "Active",
  onLogout,
  className = "",
}) => {
  return (
    <header
      className={`w-full bg-card border-b border-border sticky top-0 z-40 ${className}`}
    >
      <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left Side: Profile View shows CompanyLogo on the leftmost, Company View shows StoreInfo */}
        <div className="flex items-center gap-4 shrink-0">
          {variant === "profile" && (
            <Link
              href="/profile"
              className="hover:opacity-90 transition-opacity flex items-center"
            >
              <CompanyLogo size="md" />
            </Link>
          )}
        </div>

        {/* Right Side: User Avatar with Dropdown navigation & Logout on the rightmost */}
        <div className="flex items-center gap-3 shrink-0">
          
          <UserAvatarMenu user={user} onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
