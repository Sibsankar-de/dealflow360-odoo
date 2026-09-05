import React from "react";
import AuthBrandingPanel from "@/components/modules/auth/AuthBrandingPanel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen max-h-screen w-full overflow-hidden flex flex-col lg:flex-row bg-surface text-text-primary">
      {/* Left Branding Panel */}
      <div className="hidden lg:block lg:w-1/2 h-full">
        <AuthBrandingPanel />
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-4 sm:p-8 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
