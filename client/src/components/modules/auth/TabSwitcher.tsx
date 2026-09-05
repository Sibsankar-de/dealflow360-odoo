"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

function TabSwitcher() {
  const pathname = usePathname();

  const isLogin = pathname === "/login";
  const isSignup = pathname === "/signup";

  return (
    <div className="flex items-center p-1 bg-surface rounded-xl mb-6 border border-border">
      <Link
        href="/login"
        className={clsx(
          "flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-colors",
          isLogin
            ? "bg-card text-text-primary shadow-xs"
            : "text-text-secondary hover:text-text-primary",
        )}
      >
        Log In
      </Link>

      <Link
        href="/signup"
        className={clsx(
          "flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-colors",
          isSignup
            ? "bg-card text-text-primary shadow-xs"
            : "text-text-secondary hover:text-text-primary",
        )}
      >
        Sign Up
      </Link>
    </div>
  );
}

export default TabSwitcher;
