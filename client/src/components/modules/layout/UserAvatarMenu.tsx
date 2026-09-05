"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown } from "@/components/ui/Dropdown";
import { Badge } from "@/components/ui/Badge";
import { User, LogOut, ChevronDown } from "lucide-react";

export interface UserAvatarMenuProps {
  user: {
    fullName: string;
    email: string;
    platformRole?: string;
  };
  onLogout?: () => void;
  className?: string;
}

export const UserAvatarMenu: React.FC<UserAvatarMenuProps> = ({
  user,
  onLogout,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/40 cursor-pointer"
        aria-label="User navigation menu"
        aria-expanded={isOpen}
      >
        <Avatar name={user.fullName} size="sm" className="ring-1 ring-border" />
        <div className="hidden sm:flex flex-col items-start text-left">
          <span className="text-xs font-semibold text-text-primary leading-tight">
            {user.fullName}
          </span>
          <span className="text-[10px] text-text-muted leading-tight">
            {user.email}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      <Dropdown
        open={isOpen}
        onClose={() => setIsOpen(false)}
        placement="bottom"
        className="right-0 left-auto w-56 p-1.5 mt-2"
      >
        <div className="px-3 py-2 border-b border-border mb-1">
          <p className="text-xs font-semibold text-text-primary truncate">
            {user.fullName}
          </p>
          <p className="text-[11px] text-text-secondary truncate mt-0.5">
            {user.email}
          </p>
          {user.platformRole && (
            <div className="mt-1.5">
              <Badge variant="secondary" className="text-[10px] px-2 py-0">
                {user.platformRole}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-0.5">
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface rounded-md transition-colors"
          >
            <User className="w-3.5 h-3.5 text-text-muted" />
            <span>Profile & Account</span>
          </Link>

          <div className="border-t border-border my-1" />

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onLogout?.();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-danger hover:bg-red-50 rounded-md transition-colors cursor-pointer text-left"
          >
            <LogOut className="w-3.5 h-3.5 text-danger" />
            <span>Log out</span>
          </button>
        </div>
      </Dropdown>
    </div>
  );
};

export default UserAvatarMenu;
