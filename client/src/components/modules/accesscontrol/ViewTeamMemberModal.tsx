"use client";

import React from "react";
import { Calendar, Shield, Crown, Pencil } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  CompanyMemberType,
  COMPANY_ROLE_DEFINITIONS,
  ROLE_LABELS,
  ROLE_BADGE_VARIANTS,
} from "@/types/accesscontrol";

interface ViewTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: CompanyMemberType | null;
  isOwner?: boolean;
  onEdit?: (member: CompanyMemberType) => void;
}

export function ViewTeamMemberModal({
  isOpen,
  onClose,
  member,
  isOwner = false,
  onEdit,
}: ViewTeamMemberModalProps) {
  if (!member) return null;

  const targetEmail = member.user?.email || "";
  const targetName = member.user?.userName || targetEmail || "Team Member";
  const roleDef = COMPANY_ROLE_DEFINITIONS.find((r) => r.role === member.role);
  const roleLabel = ROLE_LABELS[member.role] || member.role;
  const badgeVariant = ROLE_BADGE_VARIANTS[member.role] || "secondary";

  const joinedDate = member.createdAt
    ? new Date(member.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  const initials = (targetName || targetEmail)
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Member Details"
      description="View assigned permissions and membership details."
      size="md"
    >
      <ModalBody>
        <div className="space-y-5">
          {/* Header Profile Section */}
          <div className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-border">
            <div className="w-14 h-14 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-brand-600">
                {initials || "U"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-text-primary truncate">
                  {targetName}
                </h3>
                {isOwner && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-warning px-2 py-0.5 rounded-full border border-amber-200">
                    <Crown className="w-3 h-3" /> Owner
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary truncate mt-0.5">
                {targetEmail}
              </p>
            </div>
          </div>

          {/* Role and Permissions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Assigned Role
              </span>
              <Badge variant={badgeVariant}>{roleLabel}</Badge>
            </div>

            {roleDef && (
              <p className="text-xs text-text-secondary bg-surface p-3 rounded-lg border border-border leading-relaxed">
                {roleDef.description}
              </p>
            )}
          </div>

          {/* Details List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
            <div className="p-3 bg-surface/60 rounded-lg border border-border">
              <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                <Calendar className="w-3.5 h-3.5 text-brand-600" />
                <span>Joined Date</span>
              </div>
              <p className="text-xs font-semibold text-text-primary">
                {joinedDate}
              </p>
            </div>

            <div className="p-3 bg-surface/60 rounded-lg border border-border">
              <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                <Shield className="w-3.5 h-3.5 text-brand-600" />
                <span>Access Status</span>
              </div>
              <p className="text-xs font-semibold text-success">
                Active Member
              </p>
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" size="md" onClick={onClose}>
          Close
        </Button>
        {onEdit && (
          <Button
            variant="primary"
            size="md"
            leftIcon={<Pencil className="w-4 h-4" />}
            onClick={() => {
              onClose();
              onEdit(member);
            }}
          >
            Edit Role
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}

export default ViewTeamMemberModal;
