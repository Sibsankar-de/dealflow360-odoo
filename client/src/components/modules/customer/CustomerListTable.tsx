import React, { useState } from "react";
import { clsx } from "clsx";
import { Eye, Search, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CustomerItem } from "@/types/customer";

export interface CustomerListTableProps {
  customers: CustomerItem[];
  onViewCustomer: (customer: CustomerItem) => void;
  onCreateCustomer: () => void;
  className?: string;
}

export const CustomerListTable: React.FC<CustomerListTableProps> = ({
  customers,
  onViewCustomer,
  onCreateCustomer,
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              onChange={(e) => setSearchTerm(e.target.value)}
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
            New Customer
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider font-semibold text-text-muted bg-surface/30">
              <th className="py-3.5 px-6">Customer</th>
              <th className="py-3.5 px-4">Email</th>
              <th className="py-3.5 px-4">Quotations</th>
              <th className="py-3.5 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-xs text-text-muted">
                  No customers found matching filter.
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-surface/50 transition-colors duration-150"
                >
                  <td className="py-4 px-6 font-semibold text-text-primary whitespace-nowrap">
                    {customer.fullName}
                  </td>
                  <td className="py-4 px-4 text-text-secondary whitespace-nowrap">
                    {customer.email}
                  </td>
                  <td className="py-4 px-4 text-text-primary whitespace-nowrap font-semibold">
                    {customer.associatedQuotations.length}
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewCustomer(customer)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      className="rounded-lg text-xs font-semibold px-3 py-1.5 border-border hover:bg-surface text-text-primary"
                    >
                      View
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
