-- CreateEnum
CREATE TYPE "NegotiationStatus" AS ENUM ('APPROVED', 'UNDER_REVIEW', 'REJECTED');

-- CreateTable
CREATE TABLE "quotation_negotiations" (
    "id" UUID NOT NULL,
    "quotationId" UUID NOT NULL,
    "productId" UUID,
    "created_by" UUID NOT NULL,
    "proposed_discount" DECIMAL(12,2),
    "proposed_total" DECIMAL(12,2),
    "message" TEXT,
    "status" "NegotiationStatus" NOT NULL DEFAULT 'UNDER_REVIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotation_negotiations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quotation_negotiations_quotationId_idx" ON "quotation_negotiations"("quotationId");

-- CreateIndex
CREATE INDEX "quotation_negotiations_productId_idx" ON "quotation_negotiations"("productId");

-- CreateIndex
CREATE INDEX "quotation_negotiations_created_by_idx" ON "quotation_negotiations"("created_by");

-- CreateIndex
CREATE INDEX "quotation_negotiations_status_idx" ON "quotation_negotiations"("status");

-- AddForeignKey
ALTER TABLE "quotation_negotiations" ADD CONSTRAINT "quotation_negotiations_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_negotiations" ADD CONSTRAINT "quotation_negotiations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_negotiations" ADD CONSTRAINT "quotation_negotiations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
