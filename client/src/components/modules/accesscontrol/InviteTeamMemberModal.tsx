"use client";

import React, { useState } from "react";
import { clsx } from "clsx";
import { ChevronDown, AlertCircle, User, Check } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SearchableInput } from "@/components/ui/SearchableInput";
import {
  INVITABLE_COMPANY_ROLE_DEFINITIONS,
  BackendCompanyRole,
} from "@/types/accesscontrol";
import { useAddCompanyMemberMutation, useGetCompanyMembersQuery } from "@/store/features/company/companyApi";
import { useGetCustomersQuery } from "@/store/features/customer/customerApi";
import toast from "react-hot-toast";

interface InviteTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
}

interface MemberSearchItem {
  id: string;
  label: string;
  value: string;
  name: string;
  role?: string;
}

export function InviteTeamMemberModal({
  isOpen,
  onClose,
  companyId,
}: InviteTeamMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<BackendCompanyRole | "">("");
  const [emailError, setEmailError] = useState("");
  const [roleError, setRoleError] = useState("");
  const [serverError, setServerError] = useState("");

  const [addCompanyMember, { isLoading }] = useAddCompanyMemberMutation();

  const { data: memberData } = useGetCompanyMembersQuery(companyId, {
    skip: !isOpen || !companyId,
  });

  const { data: customerData, isFetching: isSearching } = useGetCustomersQuery(
    {
      companyId,
      params: { search: email.trim(), limit: 5 },
    },
    { skip: !isOpen || !companyId || email.trim().length < 2 }
  );

  const existingMembers = memberData?.data?.members ?? [];
  const customerMatches = customerData?.data?.docs ?? [];

  // Filter matched candidates from both customers and members
  const matchedUsers: MemberSearchItem[] = [
    ...customerMatches.map((c) => ({
      id: c.id,
      label: c.email,
      value: c.email,
      name: c.name || "Customer",
      role: c.role || "Customer",
    })),
    ...existingMembers
      .filter((m) => {
        const query = email.toLowerCase().trim();
        if (!query) return false;
        const matchesEmail = m.user?.email?.toLowerCase().includes(query);
        const matchesName = m.user?.userName?.toLowerCase().includes(query);
        return matchesEmail || matchesName;
      })
      .map((m) => ({
        id: m.userId,
        label: m.user?.email || "",
        value: m.user?.email || "",
        name: m.user?.userName || m.user?.email?.split("@")[0] || "User",
        role: m.role,
      })),
  ].filter((user, index, self) => index === self.findIndex((u) => u.value.toLowerCase() === user.value.toLowerCase()));

  const validateEmail = (value: string) => {
    if (!value.trim()) return "Email address is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return "Please enter a valid email address.";
    return "";
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const emailErr = validateEmail(email);
    const roleErr = role ? "" : "Please select a role for the member.";

    setEmailError(emailErr);
    setRoleError(roleErr);
    setServerError("");

    if (emailErr || roleErr) return;

    try {
      await addCompanyMember({
        companyId,
        data: {
          userEmail: email.trim().toLowerCase(),
          role: role as BackendCompanyRole,
        },
      }).unwrap();

      toast.success(`Team member ${email.trim()} added successfully.`);
      handleClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to add team member to company.";
      setServerError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleClose = () => {
    setEmail("");
    setRole("");
    setEmailError("");
    setRoleError("");
    setServerError("");
    onClose();
  };

  const selectedRoleDef = INVITABLE_COMPANY_ROLE_DEFINITIONS.find(
    (r) => r.role === role
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Team Member"
      description="Grant platform users access to this company workspace by specifying their registered email and role."
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <ModalBody>
          <div className="space-y-4">
            {serverError && (
              <div className="p-3 bg-red-50 border border-red-200 text-danger text-sm rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <SearchableInput<MemberSearchItem>
              label="User Email Address"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(val) => {
                setEmail(val);
                if (emailError) setEmailError(validateEmail(val));
                if (serverError) setServerError("");
              }}
              onSelect={(item) => {
                setEmail(item.value);
                if (emailError) setEmailError(validateEmail(item.value));
                if (serverError) setServerError("");
              }}
              items={matchedUsers}
              isLoading={isSearching}
              emptyMessage="No matching accounts found"
              error={emailError}
              required
              renderItem={(item) => (
                <div className="flex items-center justify-between gap-3 text-xs w-full py-0.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 font-bold text-[11px] shrink-0">
                      {item.name ? item.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary truncate">
                        {item.name}
                      </p>
                      <p className="text-text-muted truncate text-[11px]">
                        {item.value}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.role && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-text-secondary font-medium">
                        {item.role}
                      </span>
                    )}
                    {email.toLowerCase() === item.value.toLowerCase() && (
                      <Check className="w-4 h-4 text-brand-600" />
                    )}
                  </div>
                </div>
              )}
            />

            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-text-primary flex items-center gap-1 select-none">
                Assigned Role <span className="text-danger font-semibold">*</span>
              </label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value as BackendCompanyRole | "");
                    if (roleError) setRoleError("");
                    if (serverError) setServerError("");
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
                    Select an operational role
                  </option>
                  {INVITABLE_COMPANY_ROLE_DEFINITIONS.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.name}
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
              {selectedRoleDef && (
                <p className="text-xs text-text-secondary mt-1">
                  {selectedRoleDef.description}
                </p>
              )}
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="outline" size="md" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            loadingText="Adding..."
          >
            Add Member
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default InviteTeamMemberModal;


