"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { ProductList } from "@/components/modules/products";
import { useGetProductsQuery } from "@/store/features/product/productApi";

export default function ProductsPage() {
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string"
      ? params["company-id"]
      : "";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("ALL");

  const { data, isLoading } = useGetProductsQuery(
    {
      companyId,
      params: {
        page,
        limit: 10,
        search: search.trim() || undefined,
        type: type !== "ALL" ? (type as "ONE_TIME" | "RECURRING") : undefined,
      },
    },
    { skip: !companyId }
  );

  const products = data?.data?.products ?? [];
  const total = data?.data?.total ?? 0;
  const totalPages = Math.ceil(total / 10) || 1;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <ProductList
        products={products}
        companyId={companyId}
        isLoading={isLoading}
        currentPage={page}
        totalPage={totalPages}
        onPageChange={setPage}
        onSearchChange={(s) => {
          setSearch(s);
          setPage(1);
        }}
        onTypeChange={(t) => {
          setType(t);
          setPage(1);
        }}
      />
    </div>
  );
}

