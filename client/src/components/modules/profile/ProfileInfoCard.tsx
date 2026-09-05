import React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Mail, Edit3, KeyRound } from "lucide-react";
import { UserProfile } from "@/types/profile";

export interface ProfileInfoCardProps {
  user: UserProfile;
  onEditProfile: () => void;
  onChangePassword: () => void;
}

export const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({
  user,
  onEditProfile,
  onChangePassword,
}) => {
  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Avatar
            name={user.fullName}
            size="xl"
            className="ring-4 ring-border shadow-xs"
          />
          <div>
            <h1 className="text-xl font-bold text-text-primary">{user.fullName}</h1>
            <div className="flex items-center gap-2 text-sm text-text-secondary mt-1">
              <Mail className="w-3.5 h-3.5 text-text-muted" />
              <span>{user.email}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onEditProfile}
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            className="flex-1 sm:flex-none"
          >
            Edit Profile
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onChangePassword}
            leftIcon={<KeyRound className="w-3.5 h-3.5" />}
            className="flex-1 sm:flex-none"
          >
            Change Password
          </Button>
        </div>
      </div>
    </Card>
  );
};
