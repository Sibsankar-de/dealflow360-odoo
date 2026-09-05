import React from "react";
import { Navbar } from "@/components/modules/layout/Navbar";

const PROFILE_USER = {
  fullName: "Alex Rivera",
  email: "alex.rivera@example.com",
  platformRole: "User",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar variant="profile" user={PROFILE_USER} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
