"use client";

import React from "react";
import { Eye, Pencil, Trash2, Crown } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  CompanyMemberType,
  ROLE_LABELS,
  ROLE_BADGE_VARIANTS,
} from "@/types/accesscontrol";

interface TeamMembersTableProps {
  members: CompanyMemberType[];
  ownerId?: string;
  onView: (member: CompanyMemberType) => void;
  onEdit: (member: CompanyMemberType) => void;
  onDelete: (member: CompanyMemberType) => void;
  isLoading?: boolean;
}

export function TeamMembersTable({
  members,
  ownerId,
  onView,
  onEdit,
  onDelete,
  isLoading = false,
}: TeamMembersTableProps) {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-text-secondary">Loading team members...</p>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center">
        <p className="text-base font-semibold text-text-primary">
          No team members found
        </p>
        <p className="text-sm text-text-muted mt-1 max-w-sm">
          No members match the selected criteria or no collaborators have been added yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-border bg-surface/80">
              <th className="px-6 py-3.5 text-xs font-semibold text-text-secondary tracking-wide uppercase">
                Member
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold text-text-secondary tracking-wide uppercase">
                Role
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold text-text-secondary tracking-wide uppercase">
                Email
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold text-text-secondary tracking-wide uppercase">
                Joined Date
              </th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold text-text-secondary tracking-wide uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((member) => {
              const targetEmail = member.user?.email || "Unknown Email";
              const targetName =
                member.user?.userName || targetEmail.split("@")[0] || "Member";
              const isOwner = Boolean(ownerId && member.userId === ownerId);
              const roleLabel = ROLE_LABELS[member.role] || member.role;
              const badgeVariant =
                ROLE_BADGE_VARIANTS[member.role] || "secondary";

              const formattedJoinedDate = member.createdAt
                ? new Date(member.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "-";

              const initials = (targetName || targetEmail)
                .split(" ")
                .map((w) => w[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <tr
                  key={member.id}
                  className="hover:bg-surface/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-brand-600">
                          {initials || "U"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-text-primary truncate">
                            {targetName}
                          </span>
                          {isOwner && (
                            <span
                              title="Company Owner"
                              className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-amber-50 text-warning px-1.5 py-0.5 rounded border border-amber-200 shrink-0"
                            >
                              <Crown className="w-2.5 h-2.5" /> Owner
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-text-muted md:hidden block truncate">
                          {targetEmail}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={badgeVariant}>{roleLabel}</Badge>
                  </td>
                  <td className="px-6 py-4 text-text-secondary truncate max-w-[200px]">
                    {targetEmail}
                  </td>
                  <td className="px-6 py-4 text-text-muted whitespace-nowrap">
                    {formattedJoinedDate}
                  </td>
                  <td className="px-6 py-4 text-right">
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
                        disabled={isOwner}
                        title={
                          isOwner
                            ? "Cannot remove company owner"
                            : "Remove member"
                        }
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        className={
                          isOwner
                            ? "text-text-muted cursor-not-allowed opacity-50"
                            : "text-danger hover:bg-danger/10 hover:text-danger"
                        }
                        onClick={() => onDelete(member)}
                      >
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TeamMembersTable;

