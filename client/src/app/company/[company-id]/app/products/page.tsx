"use client";

import React from "react";
import { useParams } from "next/navigation";
import { ProductList } from "@/components/modules/products";
import { useGetProductsQuery } from "@/store/features/product/productApi";

export default function ProductsPage() {
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string"
      ? params["company-id"]
      : "";

  const { data, isLoading } = useGetProductsQuery(
    { companyId },
    { skip: !companyId }
  );

  const products = React.useMemo(() => {
    if (!data?.data) return [];
    const rawData = data.data;
    if (Array.isArray(rawData)) return rawData;
    if ("products" in rawData && Array.isArray(rawData.products)) {
      return rawData.products;
    }
    return [];
  }, [data]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <ProductList
        products={products}
        companyId={companyId}
        isLoading={isLoading}
      />
    </div>
  );
}
