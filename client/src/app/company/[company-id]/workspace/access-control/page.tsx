"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  UserPlus,
  Search,
  Users,
  ShieldCheck,
  Briefcase,
  DollarSign,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  InviteTeamMemberModal,
  EditTeamMemberRoleModal,
  DeleteTeamMemberModal,
  ViewTeamMemberModal,
  TeamMembersTable,
} from "@/components/modules/accesscontrol";
import {
  useGetCompanyMembersQuery,
  useGetCompanyByIdQuery,
} from "@/store/features/company/companyApi";
import { CompanyMemberType, BackendCompanyRole } from "@/types/accesscontrol";

export default function AccessControlPage() {
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string" ? params["company-id"] : "";

  const {
    data: membersData,
    isLoading: isMembersLoading,
    isError: isMembersError,
    error: membersError,
    refetch: refetchMembers,
  } = useGetCompanyMembersQuery(companyId, {
    skip: !companyId,
  });

  const { data: companyData } = useGetCompanyByIdQuery(companyId, {
    skip: !companyId,
  });

  const company = companyData?.data?.company;
  const rawMembers: CompanyMemberType[] = membersData?.data?.members ?? [];

  // Modal States
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [viewingMember, setViewingMember] = useState<CompanyMemberType | null>(
    null
  );
  const [editingMember, setEditingMember] = useState<CompanyMemberType | null>(
    null
  );
  const [deletingMember, setDeletingMember] =
    useState<CompanyMemberType | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = rawMembers.length;
    const admins = rawMembers.filter((m) => m.role === "ADMIN").length;
    const sales = rawMembers.filter(
      (m) => m.role === "SALES_REP" || m.role === "SALES_MANAGER"
    ).length;
    const finance = rawMembers.filter(
      (m) => m.role === "FINANCE_MANAGER"
    ).length;

    return { total, admins, sales, finance };
  }, [rawMembers]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return rawMembers.filter((member) => {
      const email = member.user?.email?.toLowerCase() || "";
      const name = member.user?.userName?.toLowerCase() || "";
      const search = searchQuery.toLowerCase().trim();

      const matchesSearch = !search || email.includes(search) || name.includes(search);
      const matchesRole =
        roleFilter === "ALL" || member.role === (roleFilter as BackendCompanyRole);

      return matchesSearch && matchesRole;
    });
  }, [rawMembers, searchQuery, roleFilter]);

  const errorMessage =
    (membersError as { data?: { message?: string } })?.data?.message ||
    "Failed to load company members.";

  return (
    <div className="h-full bg-surface flex flex-col">
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Access Control
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Manage team members, assign operational roles, and control company permissions.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsInviteOpen(true)}
            className="shrink-0 shadow-xs"
          >
            Add Team Member
          </Button>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
            <div className="flex items-center gap-2 text-text-muted mb-1">
              <Users className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-medium uppercase tracking-wider">
                Total Members
              </span>
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {metrics.total}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
            <div className="flex items-center gap-2 text-text-muted mb-1">
              <ShieldCheck className="w-4 h-4 text-purple" />
              <span className="text-xs font-medium uppercase tracking-wider">
                Admins
              </span>
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {metrics.admins}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
            <div className="flex items-center gap-2 text-text-muted mb-1">
              <Briefcase className="w-4 h-4 text-warning" />
              <span className="text-xs font-medium uppercase tracking-wider">
                Sales Team
              </span>
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {metrics.sales}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
            <div className="flex items-center gap-2 text-text-muted mb-1">
              <DollarSign className="w-4 h-4 text-success" />
              <span className="text-xs font-medium uppercase tracking-wider">
                Finance Team
              </span>
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {metrics.finance}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {isMembersError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-danger text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={() => refetchMembers()}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Search and Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="w-full sm:max-w-xs">
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: "ALL", label: "All Roles" },
              { key: "ADMIN", label: "Admins" },
              { key: "SALES_REP", label: "Sales Reps" },
              { key: "SALES_MANAGER", label: "Sales Managers" },
              { key: "FINANCE_MANAGER", label: "Finance" },
              { key: "CUSTOMER", label: "Customers" },
            ].map((filter) => {
              const isSelected = roleFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setRoleFilter(filter.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 border ${
                    isSelected
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-card text-text-secondary border-border hover:bg-surface hover:text-text-primary"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Team Members Table */}
        <TeamMembersTable
          members={filteredMembers}
          ownerId={company?.ownerId}
          isLoading={isMembersLoading}
          onView={(member) => setViewingMember(member)}
          onEdit={(member) => setEditingMember(member)}
          onDelete={(member) => setDeletingMember(member)}
        />
      </main>

      {/* Invite/Add Member Modal */}
      <InviteTeamMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        companyId={companyId}
      />

      {/* Edit Member Role Modal */}
      <EditTeamMemberRoleModal
        isOpen={Boolean(editingMember)}
        onClose={() => setEditingMember(null)}
        companyId={companyId}
        member={editingMember}
        isOwner={Boolean(
          company?.ownerId && editingMember?.userId === company.ownerId
        )}
      />

      {/* Delete Member Confirmation Modal */}
      <DeleteTeamMemberModal
        isOpen={Boolean(deletingMember)}
        onClose={() => setDeletingMember(null)}
        companyId={companyId}
        member={deletingMember}
        isOwner={Boolean(
          company?.ownerId && deletingMember?.userId === company.ownerId
        )}
      />

      {/* View Member Details Modal */}
      <ViewTeamMemberModal
        isOpen={Boolean(viewingMember)}
        onClose={() => setViewingMember(null)}
        member={viewingMember}
        isOwner={Boolean(
          company?.ownerId && viewingMember?.userId === company.ownerId
        )}
        onEdit={(m) => setEditingMember(m)}
      />
    </div>
  );
}

