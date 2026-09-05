"use client";

import React, { useState } from "react";
import { UserProfile, CompanyAffiliation } from "@/types/profile";
import { Navbar } from "@/components/modules/layout/Navbar";
import { ProfileInfoCard } from "@/components/modules/profile/ProfileInfoCard";
import { CompanyList } from "@/components/modules/profile/CompanyList";
import { EditProfileModal } from "@/components/modules/profile/EditProfileModal";
import { ChangePasswordModal } from "@/components/modules/profile/ChangePasswordModal";
import { CreateCompanyModal } from "@/components/modules/profile/CreateCompanyModal";
import { CheckCircle2 } from "lucide-react";

const INITIAL_USER: UserProfile = {
  id: "usr_01",
  fullName: "Alex Rivera",
  email: "alex.rivera@example.com",
  phone: "+1 (555) 234-5678",
  platformRole: "User",
  companies: [
    {
      id: "comp_01",
      name: "Acme Industrial Supplies",
      code: "ACME-IND",
      role: "Company Admin",
      status: "Active",
      joinedAt: "2025-01-10",
    },
    {
      id: "comp_02",
      name: "Apex Logistics Corp",
      code: "APEX-LOG",
      role: "Sales Representative",
      status: "Active",
      joinedAt: "2025-03-15",
    },
    {
      id: "comp_03",
      name: "Horizon Global Trading",
      code: "HZN-TRD",
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

  const handleCreateCompany = (data: { name: string; code: string; industry?: string }) => {
    const newCompany: CompanyAffiliation = {
      id: `comp_${Date.now()}`,
      name: data.name,
      code: data.code,
      role: "Company Admin",
      status: "Active",
      joinedAt: new Date().toISOString().split("T")[0],
    };

    setUser((prev) => ({
      ...prev,
      companies: [newCompany, ...prev.companies],
    }));
    showNotification(`Company "${data.name}" created successfully. You are assigned as Company Admin.`);
  };

  const handleViewCompany = (company: CompanyAffiliation) => {
    showNotification(`Switched to company context: ${company.name}`);
  };

  const handleLogout = () => {
    showNotification("Logging out of DealFlow360 session...");
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar variant="profile" user={user} onLogout={handleLogout} />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
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
    </div>
  );
}
