import React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowRight, Calendar, Hash } from "lucide-react";
import { CompanyAffiliation, CompanyRole } from "@/types/profile";

export interface CompanyCardProps {
  company: CompanyAffiliation;
  onView?: (company: CompanyAffiliation) => void;
  className?: string;
}

const ROLE_BADGE_VARIANTS: Record<CompanyRole, BadgeVariant> = {
  "Company Admin": "purple",
  "Sales Representative": "primary",
  "Sales Manager": "info",
  "Finance Manager": "success",
  User: "secondary",
};

export const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  onView,
  className = "",
}) => {
  const badgeVariant = ROLE_BADGE_VARIANTS[company.role] || "secondary";

  return (
    <Card
      className={`p-5 w-full hover:border-text-secondary/40 transition-colors ${className}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
        {/* Column 1: Company Identity (Avatar, Name, Status) - 5 cols */}
        <div className="md:col-span-5 flex items-center gap-3.5 min-w-0">
          <Avatar
            name={company.name}
            size="lg"
            className="ring-2 ring-border shrink-0"
          />
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-text-primary leading-tight truncate">
              {company.name}
            </h3>
            {company.status && (
              <div className="mt-1">
                <Badge
                  variant={company.status === "Active" ? "success" : "secondary"}
                  className="text-[10px] px-2 py-0"
                >
                  {company.status}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Metadata (Code & Joined Date) - 3 cols */}
        <div className="md:col-span-3 flex flex-col justify-center gap-1 text-xs text-text-muted border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-4">
          {company.code && (
            <div className="flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <span className="font-mono text-text-secondary font-medium">
                {company.code}
              </span>
            </div>
          )}
          {company.joinedAt && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <span>Joined {company.joinedAt}</span>
            </div>
          )}
        </div>

        {/* Column 3: Assigned Role - 2 cols */}
        <div className="md:col-span-2 flex flex-col items-start md:items-center justify-center border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-2">
          <span className="text-[11px] font-medium text-text-muted mb-1 md:block hidden">
            Assigned Role
          </span>
          <Badge variant={badgeVariant} className="text-xs">
            {company.role}
          </Badge>
        </div>

        {/* Column 4: View Action - 2 cols */}
        <div className="md:col-span-2 flex items-center justify-end border-t md:border-t-0 border-border pt-3 md:pt-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onView?.(company)}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="w-full md:w-auto"
          >
            Open
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CompanyCard;
