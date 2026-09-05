"use client";

import React from "react";
import Link from "next/link";
import { AppLogo } from "@/components/ui/AppLogo";
import { UserAvatarMenu } from "./UserAvatarMenu";
import { useAuth } from "@/context/AuthContext";

export type NavbarVariant = "profile" | "company";

export interface NavbarProps {
  variant?: NavbarVariant;
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
        {/* Left Side: Profile View shows AppLogo with black text on the leftmost */}
        <div className="flex items-center gap-4 shrink-0">
          {variant === "profile" && (
            <Link
              href="/profile"
              className="hover:opacity-90 transition-opacity flex items-center"
            >
              <AppLogo size="md" textColor="black" />
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
