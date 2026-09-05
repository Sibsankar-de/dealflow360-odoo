"use client";

import React from "react";
import Link from "next/link";
import { AppLogo } from "@/components/ui/AppLogo";
import { UserAvatarMenu } from "./UserAvatarMenu";
import { useAuth } from "@/context/AuthContext";

import { StoreInfo } from "./StoreInfo";

export type NavbarVariant = "profile" | "company" | "customer";

export interface NavbarProps {
  variant?: NavbarVariant;
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
  companyInfo,
  user: propUser,
  onLogout: propOnLogout,
  className = "",
}) => {
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
  return (
    <header
      className={`w-full bg-card border-b border-border sticky top-0 z-40 ${className}`}
    >
      <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left Side: Profile and Customer View show AppLogo on the leftmost */}
        <div className="flex items-center gap-4 shrink-0">
          {(variant === "profile" || variant === "customer") && (
            <Link
              href={variant === "customer" ? "/profile" : "/profile"}
              className="hover:opacity-90 transition-opacity flex items-center"
            >
              <AppLogo size="md" textColor="black" />
            </Link>
          )}
        </div>

        {/* Right Side: CompanyInfo (if provided/customer) + User Avatar with Dropdown navigation & Logout */}
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
    </header>
  );
};

export default Navbar;
