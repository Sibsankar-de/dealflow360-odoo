import React, { useState } from "react";
import { clsx } from "clsx";
import { Eye, Search, Plus, User, Shield } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CustomerResponseType, CustomerTier } from "@/types/customer";

export interface CustomerListTableProps {
  customers: CustomerResponseType[];
  isLoading?: boolean;
  onViewCustomer: (customer: CustomerResponseType) => void;
  onCreateCustomer: () => void;
  onSearchChange?: (search: string) => void;
  onTierChange?: (tier: CustomerTier | undefined) => void;
  className?: string;
}

export const CustomerListTable: React.FC<CustomerListTableProps> = ({
  customers,
  isLoading,
  onViewCustomer,
  onCreateCustomer,
  onSearchChange,
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (val: string) => {
    setSearchTerm(val);
    onSearchChange?.(val);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTierBadge = (tier: CustomerTier | null | undefined) => {
    switch (tier) {
      case "GOLD":
        return <Badge variant="warning" className="text-[10px] px-2 py-0">Gold Tier</Badge>;
      case "SILVER":
        return <Badge variant="info" className="text-[10px] px-2 py-0">Silver Tier</Badge>;
      case "BRONZE":
        return <Badge variant="secondary" className="text-[10px] px-2 py-0">Bronze Tier</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] px-2 py-0">Standard</Badge>;
    }
  };


  return (
    <Card className={clsx("rounded-2xl border border-border bg-card shadow-xs overflow-hidden", className)}>
      <CardHeader className="px-6 py-5 border-b border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg font-bold text-text-primary">
            Customer Directory
          </CardTitle>
          <p className="text-xs text-text-secondary mt-1">
            Registered customer accounts eligible for quotation issuance and deal tracking.
          </p>
        </div>

        {/* Action Controls: Search & New Customer Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by name, email..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 text-xs text-text-primary bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={onCreateCustomer}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shrink-0 font-semibold rounded-xl shadow-xs"
          >
            Add Customer
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse min-w-150">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider font-semibold text-text-muted bg-surface/30">
              <th className="py-3.5 px-6">Customer</th>
              <th className="py-3.5 px-4">Email</th>
              <th className="py-3.5 px-4">Tier / Role</th>
              <th className="py-3.5 px-4">Registered Date</th>
              <th className="py-3.5 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-text-muted">
                  Loading customer directory...
                </td>
              </tr>
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-text-muted">
                  No customers found in directory. Click Add Customer to add one.
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-surface/50 transition-colors duration-150"
                >
                  <td className="py-4 px-6 font-semibold text-text-primary whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 font-bold text-xs shrink-0">
                        {customer.name ? customer.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                      </div>
                      <span>{customer.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-text-secondary whitespace-nowrap">
                    {customer.email}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getTierBadge(customer.customerTier)}
                      <Badge variant="purple" className="text-[10px] px-2 py-0">
                        {customer.role || "CUSTOMER"}
                      </Badge>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-xs text-text-muted whitespace-nowrap">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewCustomer(customer)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      className="rounded-lg text-xs font-semibold px-3 py-1.5 border-border hover:bg-surface text-text-primary"
                    >
                      View Profile
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export default CustomerListTable;
