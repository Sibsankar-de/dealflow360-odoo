"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-surface gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="text-xs font-medium text-text-secondary animate-pulse">
          Authenticating session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-surface gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="text-xs font-medium text-text-secondary">
          Redirecting to login...
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
