import React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowRight, Calendar } from "lucide-react";
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
      className={`p-4 sm:p-5 hover:border-text-muted transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}
    >
      {/* Left: Avatar, Name, Code, and Joined Date */}
      <div className="flex items-center gap-4 min-w-0">
        <Avatar name={company.name} size="md" className="ring-2 ring-border shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm sm:text-base font-semibold text-text-primary leading-tight truncate">
              {company.name}
            </h3>
            {company.status && (
              <Badge
                variant={company.status === "Active" ? "success" : "secondary"}
                className="text-[10px] px-2 py-0"
              >
                {company.status}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-text-muted mt-1 flex-wrap">
            {company.code && (
              <span className="font-mono bg-surface px-1.5 py-0.5 rounded border border-border text-[11px]">
                {company.code}
              </span>
            )}
            {company.joinedAt && (
              <span className="flex items-center gap-1 text-[11px]">
                <Calendar className="w-3 h-3" />
                Joined {company.joinedAt}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Role Badge & View Button */}
      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-secondary hidden md:inline">Role:</span>
          <Badge variant={badgeVariant}>{company.role}</Badge>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onView?.(company)}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          View
        </Button>
      </div>
    </Card>
  );
};

export default CompanyCard;
