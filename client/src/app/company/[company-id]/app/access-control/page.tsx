"use client";

import React, { useState } from "react";
import { UserPlus } from "lucide-react";
import { Navbar } from "@/components/modules/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { InviteTeamMemberModal } from "@/components/modules/accesscontrol/InviteTeamMemberModal";
import { TeamMembersTable } from "@/components/modules/accesscontrol/TeamMembersTable";
import { TeamMember } from "@/types/accesscontrol";

const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: "1",
    name: "Arjun Mehta",
    email: "arjun.mehta@company.com",
    role: "Sales Representative",
    joinedAt: "2025-01-15",
  },
  {
    id: "2",
    name: "Priya Sharma",
    email: "priya.sharma@company.com",
    role: "Sales Manager",
    joinedAt: "2025-02-20",
  },
  {
    id: "3",
    name: "Rohan Das",
    email: "rohan.das@company.com",
    role: "Finance Manager",
    joinedAt: "2025-03-10",
  },
  {
    id: "4",
    name: "Sana Khan",
    email: "sana.khan@company.com",
    role: "Sales Representative",
    joinedAt: "2025-04-05",
  },
];

const mockUser = {
  fullName: "Alex Rivera",
  email: "alex.rivera@example.com",
  platformRole: "Company Admin",
};

export default function AccessControlPage() {
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const handleInvite = (
    member: Omit<TeamMember, "id" | "joinedAt">
  ) => {
    const newMember: TeamMember = {
      ...member,
      id: String(Date.now()),
      joinedAt: new Date().toISOString().split("T")[0],
    };
    setMembers((prev) => [...prev, newMember]);
  };

  const handleDelete = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleView = (member: TeamMember) => {
    console.log("View member:", member.id);
  };

  const handleEdit = (member: TeamMember) => {
    console.log("Edit member:", member.id);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar variant="company" user={mockUser} />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Access Control
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Manage team member roles and permissions within your company.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsInviteOpen(true)}
            className="shrink-0"
          >
            Invite Member
          </Button>
        </div>

        <TeamMembersTable
          members={members}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </main>

      <InviteTeamMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInvite={handleInvite}
      />
    </div>
  );
}
