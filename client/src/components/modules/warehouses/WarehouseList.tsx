"use client";

import React, { useState } from "react";
import { WarehouseResponseType } from "@/types/warehouse";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { WarehouseModal } from "./WarehouseModal";
import { DeleteWarehouseModal } from "./DeleteWarehouseModal";
import { Pagination } from "@/components/ui/Pagination";
import {
  Warehouse as WarehouseIcon,
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  Package,
} from "lucide-react";

interface WarehouseListProps {
  warehouses: WarehouseResponseType[];
  companyId: string;
  isLoading?: boolean;
  currentPage?: number;
  totalPage?: number;
  onPageChange?: (page: number) => void;
}

export const WarehouseList: React.FC<WarehouseListProps> = ({
  warehouses,
  companyId,
  isLoading = false,
  currentPage = 1,
  totalPage = 1,
  onPageChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] =
    useState<WarehouseResponseType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteWarehouse, setDeleteWarehouse] =
    useState<WarehouseResponseType | null>(null);

  const filteredWarehouses = warehouses.filter((w) => {
    return (
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.addressLine.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.postalCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleEdit = (w: WarehouseResponseType) => {
    setSelectedWarehouse(w);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedWarehouse(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Warehouses & Locations
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Manage physical warehouses, inventory locations, and distribution nodes.
          </p>
        </div>
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleCreate}
        >
          Add Warehouse
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-card p-4 rounded-xl border border-border">
        <Input
          leftIcon={<Search className="w-4 h-4" />}
          placeholder="Search warehouses by name, country, address, or postal code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Warehouse Cards Grid */}
      {isLoading ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-text-muted">
          <WarehouseIcon className="w-8 h-8 animate-pulse mx-auto mb-3 text-brand-600" />
          <p className="text-sm">Loading warehouses...</p>
        </div>
      ) : filteredWarehouses.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <WarehouseIcon className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-semibold text-text-primary">
            No warehouses found
          </h3>
          <p className="text-sm text-text-muted mt-1 max-w-sm mx-auto">
            {searchTerm
              ? "No warehouses matched your search. Try a different query."
              : "Set up your first warehouse to enable multi-location inventory management."}
          </p>
          {!searchTerm && (
            <Button
              variant="outline"
              className="mt-4"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleCreate}
            >
              Add First Warehouse
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWarehouses.map((w) => (
            <div
              key={w.id}
              className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                      <WarehouseIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary text-base">
                        {w.name}
                      </h3>
                      <p className="text-xs text-text-muted">{w.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(w)}
                      className="p-1.5 text-text-muted hover:text-brand-600 rounded-md hover:bg-surface transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteWarehouse(w)}
                      className="p-1.5 text-text-muted hover:text-danger rounded-md hover:bg-surface transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border space-y-2 text-xs text-text-secondary">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                    <div>
                      <div>{w.addressLine}</div>
                      <div className="text-text-muted">Postal Code: {w.postalCode}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-text-muted">
                <div className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-brand-600" />
                  <span>
                    {w.totalProductsCount ?? 0} Products stocked
                  </span>
                </div>
                <span>
                  {w.totalStockUnits ?? 0} total units
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPage > 1 && (
        <div className="pt-2">
          <Pagination
            currentPage={currentPage}
            totalPage={totalPage}
            onPageChange={onPageChange}
          />
        </div>
      )}

      {/* Modals */}
      <WarehouseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        companyId={companyId}
        warehouse={selectedWarehouse}
      />

      <DeleteWarehouseModal
        isOpen={Boolean(deleteWarehouse)}
        onClose={() => setDeleteWarehouse(null)}
        companyId={companyId}
        warehouse={deleteWarehouse}
      />
    </div>
  );
};

export default WarehouseList;

