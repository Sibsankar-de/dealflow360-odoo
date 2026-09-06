"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { ProductList } from "@/components/modules/products";
import { CategoryList } from "@/components/modules/categories";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { useGetProductsQuery } from "@/store/features/product/productApi";
import { useGetCategoriesQuery } from "@/store/features/category/categoryApi";
import { Package, FolderTree } from "lucide-react";

export default function ProductsPage() {
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string"
      ? params["company-id"]
      : "";

  const [activeTab, setActiveTab] = useState<"products" | "categories">("products");

  // Products Tab State
  const [productPage, setProductPage] = useState(1);
  const [productSearch, setProductSearch] = useState("");
  const [productType, setProductType] = useState<string>("ALL");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");

  const { data: productData, isLoading: isProductsLoading } = useGetProductsQuery(
    {
      companyId,
      params: {
        page: productPage,
        limit: 10,
        search: productSearch.trim() || undefined,
        type: productType !== "ALL" ? (productType as "ONE_TIME" | "RECURRING") : undefined,
        categoryId: selectedCategoryId !== "ALL" ? selectedCategoryId : undefined,
      },
    },
    { skip: !companyId }
  );

  const products = productData?.data?.products ?? [];
  const totalProducts = productData?.data?.total ?? 0;
  const totalProductPages = Math.ceil(totalProducts / 10) || 1;

  // Categories Tab State
  const [categoryPage, setCategoryPage] = useState(1);
  const [categorySearch, setCategorySearch] = useState("");

  const { data: categoryData, isLoading: isCategoriesLoading } = useGetCategoriesQuery(
    {
      companyId,
      params: {
        page: categoryPage,
        limit: 10,
        search: categorySearch.trim() || undefined,
      },
    },
    { skip: !companyId }
  );

  const categories = categoryData?.data?.docs ?? [];
  const totalCategories = categoryData?.data?.total ?? 0;
  const totalCategoryPages =
    categoryData?.data?.totalPages || Math.ceil(totalCategories / 10) || 1;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-card rounded-xl border border-border p-4 pb-0">
        <Tabs
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as "products" | "categories")}
          tabs={[
            {
              id: "products",
              label: "Products Catalog",
              icon: <Package className="w-4 h-4" />,
              badge: (
                <Badge variant="secondary" className="text-xs px-2 py-0">
                  {totalProducts}
                </Badge>
              ),
            },
            {
              id: "categories",
              label: "Product Categories",
              icon: <FolderTree className="w-4 h-4" />,
              badge: (
                <Badge variant="secondary" className="text-xs px-2 py-0">
                  {totalCategories}
                </Badge>
              ),
            },
          ]}
        />
      </div>

      {activeTab === "products" ? (
        <ProductList
          products={products}
          companyId={companyId}
          isLoading={isProductsLoading}
          currentPage={productPage}
          totalPage={totalProductPages}
          onPageChange={setProductPage}
          onSearchChange={(s) => {
            setProductSearch(s);
            setProductPage(1);
          }}
          onTypeChange={(t) => {
            setProductType(t);
            setProductPage(1);
          }}
          selectedCategoryId={selectedCategoryId}
          onCategoryChange={(c) => {
            setSelectedCategoryId(c);
            setProductPage(1);
          }}
        />
      ) : (
        <CategoryList
          categories={categories}
          companyId={companyId}
          isLoading={isCategoriesLoading}
          currentPage={categoryPage}
          totalPage={totalCategoryPages}
          onPageChange={setCategoryPage}
          onSearchChange={(s) => {
            setCategorySearch(s);
            setCategoryPage(1);
          }}
        />
      )}
    </div>
  );
}

