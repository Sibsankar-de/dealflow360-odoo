"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileText } from "lucide-react";

export default function DealDetailPage() {
  const router = useRouter();
  const params = useParams();
  const companyId =
    typeof params?.["company-id"] === "string" ? params["company-id"] : "";
  const dealId =
    typeof params?.["deal-id"] === "string" ? params["deal-id"] : "";

  useEffect(() => {
    if (companyId && dealId) {
      router.replace(
        `/company/${companyId}/workspace/deals/${dealId}/quotations`
      );
    }
  }, [companyId, dealId, router]);

  return (
    <div className="max-w-6xl mx-auto p-12 text-center text-text-muted">
      <FileText className="w-8 h-8 animate-pulse mx-auto mb-3 text-brand-600" />
      <p className="text-sm">Redirecting to deal quotations...</p>
    </div>
  );
}

