import React from "react";
import { Navbar } from "@/components/modules/layout/Navbar";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar variant="profile" />
        <div className="flex-1">{children}</div>
      </div>
    </ProtectedRoute>
  );
}
