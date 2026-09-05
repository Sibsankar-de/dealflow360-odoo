"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { UserProfile, CompanyAffiliation, mapCompanyResponseToAffiliation } from "@/types/profile";
import { CompanyResponseType } from "@/types/company";
import { ProfileInfoCard } from "@/components/modules/profile/ProfileInfoCard";
import { CompanyList } from "@/components/modules/profile/CompanyList";
import { EditProfileModal } from "@/components/modules/profile/EditProfileModal";
import { ChangePasswordModal } from "@/components/modules/profile/ChangePasswordModal";
import { CreateCompanyModal, CreateCompanyData } from "@/components/modules/profile/CreateCompanyModal";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  useGetUserCompaniesQuery,
  useCreateCompanyMutation,
} from "@/store/features/company/companyApi";

export default function ProfilePage() {
  const { user: authUser, updateProfile, updatePassword } = useAuth();

  const [page, setPage] = useState(1);
  const { data: companiesData, isLoading: isCompaniesLoading } =
    useGetUserCompaniesQuery({ page, limit: 10 });
  const [createCompanyMutation] = useCreateCompanyMutation();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const router = useRouter();

  const rawCompanies =
    companiesData?.data?.docs ?? [];
  const totalPages = companiesData?.data?.totalPages ?? 1;

  const companies: CompanyAffiliation[] =
    rawCompanies.map(mapCompanyResponseToAffiliation);

  const displayUser: UserProfile = {
    id: authUser?.id || "",
    fullName: authUser?.userName || "User",
    email: authUser?.email || "",
    platformRole: authUser?.role || "User",
    companies,
  };

  const showNotification = (message: string) => {
    setFeedbackMessage(message);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  const handleSaveProfile = async (data: { fullName: string }) => {
    await updateProfile({ userName: data.fullName });
    showNotification("Profile details updated successfully.");
  };

  const handleSavePassword = async (data: { currentPassword: string; newPassword: string }) => {
    await updatePassword(data);
    showNotification("Password changed successfully.");
  };

  const handleCreateCompany = async (data: CreateCompanyData) => {
    const response = await createCompanyMutation({
      name: data.name,
      country: data.country,
      postalCode: data.postalCode,
      addressLine: data.addressLine,
      currency: data.currency,
    }).unwrap();

    const createdCompanyName = response.data?.company?.name || data.name;
    showNotification(`Company "${createdCompanyName}" created successfully. You are assigned as Company Admin.`);
  };

  const handleViewCompany = (company: CompanyAffiliation) => {
    if (company.role === "Customer") {
      router.push(`/company/${company.id}/customer`);
    } else {
      router.push(`/company/${company.id}/app/dashboard`);
    }
  };

  return (
    <main className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Account Profile</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage your personal details, credentials, and company workspace affiliations
          </p>
        </div>

        {feedbackMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-success flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        <ProfileInfoCard
          user={displayUser}
          onEditProfile={() => setIsEditOpen(true)}
          onChangePassword={() => setIsPasswordOpen(true)}
        />

        <CompanyList
          companies={displayUser.companies}
          isLoading={isCompaniesLoading}
          currentPage={page}
          totalPage={totalPages}
          onPageChange={setPage}
          onViewCompany={handleViewCompany}
          onCreateCompany={() => setIsCreateCompanyOpen(true)}
        />

        <EditProfileModal
          isOpen={isEditOpen}
          initialFullName={displayUser.fullName}
          onClose={() => setIsEditOpen(false)}
          onSave={handleSaveProfile}
        />

        <ChangePasswordModal
          isOpen={isPasswordOpen}
          onClose={() => setIsPasswordOpen(false)}
          onSave={handleSavePassword}
        />

        <CreateCompanyModal
          isOpen={isCreateCompanyOpen}
          onClose={() => setIsCreateCompanyOpen(false)}
          onCreate={handleCreateCompany}
        />
      </div>
    </main>
  );
}
