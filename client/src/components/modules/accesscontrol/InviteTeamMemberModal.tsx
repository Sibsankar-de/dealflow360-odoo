"use client";

import React, { useState } from "react";
import { clsx } from "clsx";
import { Mail, ChevronDown } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TeamMember, TeamMemberRole } from "@/types/accesscontrol";

const ROLES: TeamMemberRole[] = [
  "Sales Representative",
  "Sales Manager",
  "Finance Manager",
];

interface InviteTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (member: Omit<TeamMember, "id" | "joinedAt">) => void;
}

export function InviteTeamMemberModal({
  isOpen,
  onClose,
  onInvite,
}: InviteTeamMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamMemberRole | "">("");
  const [emailError, setEmailError] = useState("");
  const [roleError, setRoleError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (value: string) => {
    if (!value.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return "Enter a valid email address.";
    return "";
  };

  const handleSubmit = () => {
    const emailErr = validateEmail(email);
    const roleErr = role ? "" : "Please select a role.";

    setEmailError(emailErr);
    setRoleError(roleErr);

    if (emailErr || roleErr) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const namePart = email.split("@")[0].replace(/[._]/g, " ");
      const name = namePart
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      onInvite({ name, email: email.trim(), role: role as TeamMemberRole });
      setIsSubmitting(false);
      handleClose();
    }, 600);
  };

  const handleClose = () => {
    setEmail("");
    setRole("");
    setEmailError("");
    setRoleError("");
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite Team Member"
      description="Send an invitation to a team member and assign their role."
      size="md"
    >
      <ModalBody>
        <div className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            placeholder="colleague@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(validateEmail(e.target.value));
            }}
            leftIcon={<Mail className="w-4 h-4" />}
            error={emailError}
            required
          />

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-text-primary flex items-center gap-1 select-none">
              Role <span className="text-danger font-semibold">*</span>
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value as TeamMemberRole | "");
                  if (roleError) setRoleError("");
                }}
                className={clsx(
                  "w-full appearance-none rounded-lg border bg-card px-3 py-2 pr-10 text-sm text-text-primary transition-colors duration-150 shadow-xs",
                  "focus:outline-none focus:ring-2 focus:ring-offset-0",
                  roleError
                    ? "border-danger focus:border-danger focus:ring-danger/20"
                    : "border-border hover:border-text-secondary focus:border-brand-600 focus:ring-brand-600/20",
                  !role && "text-text-muted"
                )}
              >
                <option value="" disabled>
                  Select a role
                </option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            {roleError && (
              <p className="text-xs font-medium text-danger">{roleError}</p>
            )}
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" size="md" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          loadingText="Sending..."
        >
          Send Invite
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default InviteTeamMemberModal;
