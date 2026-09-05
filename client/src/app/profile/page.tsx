"use client";

import React, { useState } from "react";
import { UserProfile, CompanyAffiliation } from "@/types/profile";
import { ProfileInfoCard } from "@/components/modules/profile/ProfileInfoCard";
import { CompanyList } from "@/components/modules/profile/CompanyList";
import { EditProfileModal } from "@/components/modules/profile/EditProfileModal";
import { ChangePasswordModal } from "@/components/modules/profile/ChangePasswordModal";
import { CreateCompanyModal, CreateCompanyData } from "@/components/modules/profile/CreateCompanyModal";
import { CheckCircle2 } from "lucide-react";

const INITIAL_USER: UserProfile = {
  id: "usr_01",
  fullName: "Alex Rivera",
  email: "alex.rivera@example.com",
  phone: "+1 (555) 234-5678",
  platformRole: "User",
  companies: [
    {
      id: "12983hufiu42",
      name: "Acme Industrial Supplies",
      code: "ACME-IND",
      country: "United States",
      postalCode: "94103",
      addressLine: "100 Market St, San Francisco, CA",
      currency: "USD",
      role: "Company Admin",
      status: "Active",
      joinedAt: "2025-01-10",
    },
    {
      id: "comp_02",
      name: "Apex Logistics Corp",
      code: "APEX-LOG",
      country: "United Kingdom",
      postalCode: "EC1A 1BB",
      addressLine: "25 Old Broad Street, London",
      currency: "GBP",
      role: "Sales Representative",
      status: "Active",
      joinedAt: "2025-03-15",
    },
    {
      id: "comp_03",
      name: "Horizon Global Trading",
      code: "HZN-TRD",
      country: "Singapore",
      postalCode: "018981",
      addressLine: "10 Marina Boulevard, Tower 2",
      currency: "SGD",
      role: "Finance Manager",
      status: "Active",
      joinedAt: "2025-06-20",
    },
  ],
};

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setFeedbackMessage(message);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  const handleSaveProfile = (data: { fullName: string; phone: string }) => {
    setUser((prev) => ({
      ...prev,
      fullName: data.fullName,
      phone: data.phone,
    }));
    showNotification("Profile details updated successfully.");
  };

  const handleSavePassword = () => {
    showNotification("Password changed successfully.");
  };

  const handleCreateCompany = (data: CreateCompanyData) => {
    const generatedCode = data.name
      .trim()
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 6)
      .toUpperCase();

    const newCompany: CompanyAffiliation = {
      id: `comp_${Date.now()}`,
      name: data.name,
      code: generatedCode,
      country: data.country,
      postalCode: data.postalCode,
      addressLine: data.addressLine,
      currency: data.currency,
      role: "Company Admin",
      status: "Active",
      joinedAt: new Date().toISOString().split("T")[0],
    };

    setUser((prev) => ({
      ...prev,
      companies: [newCompany, ...prev.companies],
    }));
    showNotification(`Company "${data.name}" created successfully in ${data.country}. You are assigned as Company Admin.`);
  };

  const handleViewCompany = (company: CompanyAffiliation) => {
    showNotification(`Switched to company context: ${company.name}`);
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
          user={user}
          onEditProfile={() => setIsEditOpen(true)}
          onChangePassword={() => setIsPasswordOpen(true)}
        />

        <CompanyList
          companies={user.companies}
          onViewCompany={handleViewCompany}
          onCreateCompany={() => setIsCreateCompanyOpen(true)}
        />

        <EditProfileModal
          isOpen={isEditOpen}
          initialFullName={user.fullName}
          initialPhone={user.phone}
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
