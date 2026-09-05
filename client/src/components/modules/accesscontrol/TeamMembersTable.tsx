"use client";

import React from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TeamMember, TeamMemberRole } from "@/types/accesscontrol";

const ROLE_BADGE_VARIANT: Record<
  TeamMemberRole,
  "primary" | "warning" | "purple"
> = {
  "Sales Representative": "primary",
  "Sales Manager": "warning",
  "Finance Manager": "purple",
};

interface TeamMembersTableProps {
  members: TeamMember[];
  onView: (member: TeamMember) => void;
  onEdit: (member: TeamMember) => void;
  onDelete: (id: string) => void;
}

export function TeamMembersTable({
  members,
  onView,
  onEdit,
  onDelete,
}: TeamMembersTableProps) {
  if (members.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center">
        <p className="text-sm font-medium text-text-primary">
          No team members yet
        </p>
        <p className="text-sm text-text-muted mt-1">
          Invite your first team member using the button above.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-text-secondary tracking-wide uppercase">
              Name
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-text-secondary tracking-wide uppercase">
              Role
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-text-secondary tracking-wide uppercase">
              Email
            </th>
            <th className="px-6 py-3.5 text-right text-xs font-semibold text-text-secondary tracking-wide uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {members.map((member) => (
            <tr key={member.id} className="hover:bg-surface/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-600/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-brand-600">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium text-text-primary">
                    {member.name}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <Badge variant={ROLE_BADGE_VARIANT[member.role]}>
                  {member.role}
                </Badge>
              </td>
              <td className="px-6 py-4 text-text-secondary">{member.email}</td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                    onClick={() => onView(member)}
                  >
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Pencil className="w-3.5 h-3.5" />}
                    onClick={() => onEdit(member)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-danger" />}
                    className="text-danger hover:bg-danger/10 hover:text-danger"
                    onClick={() => onDelete(member.id)}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TeamMembersTable;
