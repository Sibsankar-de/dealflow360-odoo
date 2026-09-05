import React from "react";
import { CompanyAffiliation } from "@/types/profile";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Building2, Plus } from "lucide-react";
import { CompanyCard } from "./CompanyCard";

export interface CompanyListProps {
  companies: CompanyAffiliation[];
  onViewCompany?: (company: CompanyAffiliation) => void;
  onCreateCompany?: () => void;
}

export const CompanyList: React.FC<CompanyListProps> = ({
  companies,
  onViewCompany,
  onCreateCompany,
}) => {
  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold text-text-primary">Companies & Affiliations</h2>
            <Badge variant="primary" icon={<Building2 className="w-3 h-3" />}>
              {companies.length}
            </Badge>
          </div>
          <p className="text-sm text-text-secondary mt-0.5">
            Manage your company workspaces and role permissions
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onCreateCompany}
          leftIcon={<Plus className="w-4 h-4" />}
          className="self-start sm:self-auto"
        >
          Create Company
        </Button>
      </div>

      {companies.length === 0 ? (
        <div className="py-12 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-text-primary">No company affiliations yet</p>
          <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
            You can create a new company workspace to manage products and quotations, or join an existing company.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateCompany}
            leftIcon={<Plus className="w-4 h-4" />}
            className="mt-4"
          >
            Create your first company
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mt-6">
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} onView={onViewCompany} />
          ))}
        </div>
      )}
    </Card>
  );
};

export default CompanyList;
