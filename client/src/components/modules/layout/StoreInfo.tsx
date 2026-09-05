import React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Bell, ChevronDown } from "lucide-react";

export interface StoreInfoProps {
  companyName: string;
  userRole?: string;
  status?: string;
  userName?: string;
  theme?: "dark" | "light";
  className?: string;
}

export const StoreInfo: React.FC<StoreInfoProps> = ({
  companyName,
  userRole = "Company Admin",
  status = "Active",
  userName,
  theme = "dark",
  className = "",
}) => {
  const isLight = theme === "light";

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Company / Store Badge */}
      <div className="flex items-center gap-2.5">
        <Avatar
          name={companyName}
          size="sm"
          className="ring-1 ring-border shrink-0 font-bold rounded-md!"
        />
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1">
            <span
              className={`text-sm font-semibold leading-tight ${
                isLight ? "text-text-primary" : "text-white"
              }`}
            >
              {companyName}
            </span>
          </div>
          <span
            className={`text-[10px] font-medium leading-tight ${
              isLight ? "text-text-muted" : "text-text-secondary"
            }`}
          >
            {userRole}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StoreInfo;
