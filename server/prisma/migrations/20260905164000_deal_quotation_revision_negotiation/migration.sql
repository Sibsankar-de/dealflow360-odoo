-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "DealStage" AS ENUM ('NEW', 'QUALIFICATION', 'REQUIREMENT', 'QUOTATION', 'NEGOTIATION', 'WON', 'LOST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "DealStatus" AS ENUM ('OPEN', 'WON', 'LOST', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "OfferParty" AS ENUM ('CUSTOMER', 'SALES_REP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'SUPERSEDED', 'WITHDRAWN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "RevisionType" AS ENUM ('INITIAL', 'SALES_COUNTER', 'CUSTOMER_COUNTER', 'FINAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "RevisionStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'SUPERSEDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop legacy quotation_negotiations and create fresh NegotiationStatus enum
DROP TABLE IF EXISTS "quotation_negotiations" CASCADE;
DROP TYPE IF EXISTS "NegotiationStatus" CASCADE;
CREATE TYPE "NegotiationStatus" AS ENUM ('OPEN', 'CLOSED', 'CANCELLED');

-- Alter QuotationStatus Enum
BEGIN;
CREATE TYPE "QuotationStatus_new" AS ENUM ('DRAFT', 'SENT', 'NEGOTIATING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');
ALTER TABLE "quotations" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "quotations" ALTER COLUMN "status" TYPE "QuotationStatus_new" USING ("status"::text::"QuotationStatus_new");
ALTER TYPE "QuotationStatus" RENAME TO "QuotationStatus_old";
ALTER TYPE "QuotationStatus_new" RENAME TO "QuotationStatus";
DROP TYPE "QuotationStatus_old";
ALTER TABLE "quotations" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- Drop Old ForeignKeys
ALTER TABLE "quotation_items" DROP CONSTRAINT IF EXISTS "quotation_items_productId_fkey";
ALTER TABLE "quotation_items" DROP CONSTRAINT IF EXISTS "quotation_items_quotationId_fkey";
ALTER TABLE "quotations" DROP CONSTRAINT IF EXISTS "quotations_companyId_fkey";
ALTER TABLE "quotations" DROP CONSTRAINT IF EXISTS "quotations_creatorId_fkey";
ALTER TABLE "quotations" DROP CONSTRAINT IF EXISTS "quotations_customerId_fkey";

-- Drop Old Indexes
DROP INDEX IF EXISTS "quotation_items_productId_idx";
DROP INDEX IF EXISTS "quotation_items_quotationId_idx";
DROP INDEX IF EXISTS "quotations_companyId_idx";
DROP INDEX IF EXISTS "quotations_companyId_quotation_number_key";
DROP INDEX IF EXISTS "quotations_creatorId_idx";
DROP INDEX IF EXISTS "quotations_customerId_idx";

-- Create Deals Table
CREATE TABLE IF NOT EXISTS "deals" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "deal_no" TEXT NOT NULL,
    "customer_id" UUID NOT NULL,
    "sales_rep_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "stage" "DealStage" NOT NULL DEFAULT 'NEW',
    "status" "DealStatus" NOT NULL DEFAULT 'OPEN',
    "expected_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "probability" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "expected_close_date" TIMESTAMP(3),
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- Truncate existing legacy quotation items/quotations or adapt them
TRUNCATE TABLE "quotation_items" CASCADE;
TRUNCATE TABLE "quotations" CASCADE;

-- Alter Quotations Table
ALTER TABLE "quotations" DROP COLUMN IF EXISTS "companyId",
DROP COLUMN IF EXISTS "createdAt",
DROP COLUMN IF EXISTS "creatorId",
DROP COLUMN IF EXISTS "customerId",
DROP COLUMN IF EXISTS "discount_amount",
DROP COLUMN IF EXISTS "expires_at",
DROP COLUMN IF EXISTS "notes",
DROP COLUMN IF EXISTS "quotation_date",
DROP COLUMN IF EXISTS "quotation_number",
DROP COLUMN IF EXISTS "subtotal",
DROP COLUMN IF EXISTS "total",
DROP COLUMN IF EXISTS "updatedAt",
ADD COLUMN IF NOT EXISTS "company_id" UUID NOT NULL,
ADD COLUMN IF NOT EXISTS "deal_id" UUID NOT NULL,
ADD COLUMN IF NOT EXISTS "quotation_no" TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS "customer_id" UUID NOT NULL,
ADD COLUMN IF NOT EXISTS "sales_rep_id" UUID NOT NULL,
ADD COLUMN IF NOT EXISTS "valid_until" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "current_revision_id" UUID,
ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL;

-- Alter Quotation Items Table
ALTER TABLE "quotation_items" DROP COLUMN IF EXISTS "createdAt",
DROP COLUMN IF EXISTS "discount_percentage",
DROP COLUMN IF EXISTS "productId",
DROP COLUMN IF EXISTS "quotationId",
DROP COLUMN IF EXISTS "tax_percentage",
DROP COLUMN IF EXISTS "updatedAt",
ADD COLUMN IF NOT EXISTS "quotation_id" UUID NOT NULL,
ADD COLUMN IF NOT EXISTS "product_id" UUID NOT NULL,
ADD COLUMN IF NOT EXISTS "discount_type" "DiscountType" NOT NULL DEFAULT 'PERCENTAGE',
ADD COLUMN IF NOT EXISTS "discount_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "final_unit_price" DECIMAL(12,2) NOT NULL,
ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL;

-- Create Quotation Revisions Table
CREATE TABLE IF NOT EXISTS "quotation_revisions" (
    "id" UUID NOT NULL,
    "quotation_id" UUID NOT NULL,
    "revision_no" INTEGER NOT NULL,
    "created_by" UUID NOT NULL,
    "revision_type" "RevisionType" NOT NULL DEFAULT 'INITIAL',
    "status" "RevisionStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "customer_note" TEXT,
    "internal_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotation_revisions_pkey" PRIMARY KEY ("id")
);

-- Create Quotation Revision Items Table
CREATE TABLE IF NOT EXISTS "quotation_revision_items" (
    "id" UUID NOT NULL,
    "quotation_revision_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "discount_type" "DiscountType" NOT NULL DEFAULT 'PERCENTAGE',
    "discount_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "final_unit_price" DECIMAL(12,2) NOT NULL,
    "line_total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "quotation_revision_items_pkey" PRIMARY KEY ("id")
);

-- Create Negotiations Table
CREATE TABLE IF NOT EXISTS "negotiations" (
    "id" UUID NOT NULL,
    "quotation_id" UUID NOT NULL,
    "status" "NegotiationStatus" NOT NULL DEFAULT 'OPEN',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "negotiations_pkey" PRIMARY KEY ("id")
);

-- Create Negotiation Offers Table
CREATE TABLE IF NOT EXISTS "negotiation_offers" (
    "id" UUID NOT NULL,
    "negotiation_id" UUID NOT NULL,
    "base_revision_id" UUID,
    "offered_by" "OfferParty" NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "negotiation_offers_pkey" PRIMARY KEY ("id")
);

-- Create Negotiation Offer Items Table
CREATE TABLE IF NOT EXISTS "negotiation_offer_items" (
    "id" UUID NOT NULL,
    "negotiation_offer_id" UUID NOT NULL,
    "quotation_item_id" UUID,
    "product_id" UUID NOT NULL,
    "requested_quantity" DECIMAL(12,2) NOT NULL,
    "requested_unit_price" DECIMAL(12,2) NOT NULL,
    "requested_discount_type" "DiscountType" NOT NULL DEFAULT 'PERCENTAGE',
    "requested_discount_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "requested_line_total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "negotiation_offer_items_pkey" PRIMARY KEY ("id")
);

-- Indexes for Deals
CREATE UNIQUE INDEX IF NOT EXISTS "deals_deal_no_key" ON "deals"("deal_no");
CREATE INDEX IF NOT EXISTS "deals_company_id_idx" ON "deals"("company_id");
CREATE INDEX IF NOT EXISTS "deals_customer_id_idx" ON "deals"("customer_id");
CREATE INDEX IF NOT EXISTS "deals_sales_rep_id_idx" ON "deals"("sales_rep_id");
CREATE INDEX IF NOT EXISTS "deals_stage_idx" ON "deals"("stage");
CREATE INDEX IF NOT EXISTS "deals_status_idx" ON "deals"("status");

-- Indexes for Quotations
CREATE UNIQUE INDEX IF NOT EXISTS "quotations_quotation_no_key" ON "quotations"("quotation_no");
CREATE UNIQUE INDEX IF NOT EXISTS "quotations_current_revision_id_key" ON "quotations"("current_revision_id");
CREATE INDEX IF NOT EXISTS "quotations_company_id_idx" ON "quotations"("company_id");
CREATE INDEX IF NOT EXISTS "quotations_deal_id_idx" ON "quotations"("deal_id");
CREATE INDEX IF NOT EXISTS "quotations_customer_id_idx" ON "quotations"("customer_id");
CREATE INDEX IF NOT EXISTS "quotations_sales_rep_id_idx" ON "quotations"("sales_rep_id");

-- Indexes for Quotation Items
CREATE INDEX IF NOT EXISTS "quotation_items_quotation_id_idx" ON "quotation_items"("quotation_id");
CREATE INDEX IF NOT EXISTS "quotation_items_product_id_idx" ON "quotation_items"("product_id");

-- Indexes for Quotation Revisions
CREATE INDEX IF NOT EXISTS "quotation_revisions_quotation_id_idx" ON "quotation_revisions"("quotation_id");
CREATE INDEX IF NOT EXISTS "quotation_revisions_created_by_idx" ON "quotation_revisions"("created_by");
CREATE INDEX IF NOT EXISTS "quotation_revisions_status_idx" ON "quotation_revisions"("status");
CREATE INDEX IF NOT EXISTS "quotation_revisions_revision_type_idx" ON "quotation_revisions"("revision_type");
CREATE UNIQUE INDEX IF NOT EXISTS "quotation_revisions_quotation_id_revision_no_key" ON "quotation_revisions"("quotation_id", "revision_no");

-- Indexes for Quotation Revision Items
CREATE INDEX IF NOT EXISTS "quotation_revision_items_quotation_revision_id_idx" ON "quotation_revision_items"("quotation_revision_id");
CREATE INDEX IF NOT EXISTS "quotation_revision_items_product_id_idx" ON "quotation_revision_items"("product_id");

-- Indexes for Negotiations
CREATE INDEX IF NOT EXISTS "negotiations_quotation_id_idx" ON "negotiations"("quotation_id");
CREATE INDEX IF NOT EXISTS "negotiations_status_idx" ON "negotiations"("status");

-- Indexes for Negotiation Offers
CREATE INDEX IF NOT EXISTS "negotiation_offers_negotiation_id_idx" ON "negotiation_offers"("negotiation_id");
CREATE INDEX IF NOT EXISTS "negotiation_offers_base_revision_id_idx" ON "negotiation_offers"("base_revision_id");
CREATE INDEX IF NOT EXISTS "negotiation_offers_status_idx" ON "negotiation_offers"("status");
CREATE INDEX IF NOT EXISTS "negotiation_offers_offered_by_idx" ON "negotiation_offers"("offered_by");

-- Indexes for Negotiation Offer Items
CREATE INDEX IF NOT EXISTS "negotiation_offer_items_negotiation_offer_id_idx" ON "negotiation_offer_items"("negotiation_offer_id");
CREATE INDEX IF NOT EXISTS "negotiation_offer_items_quotation_item_id_idx" ON "negotiation_offer_items"("quotation_item_id");
CREATE INDEX IF NOT EXISTS "negotiation_offer_items_product_id_idx" ON "negotiation_offer_items"("product_id");

-- Foreign Keys for Deals
ALTER TABLE "deals" ADD CONSTRAINT "deals_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deals" ADD CONSTRAINT "deals_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "deals" ADD CONSTRAINT "deals_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Foreign Keys for Quotations
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Foreign Keys for Quotation Items
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Foreign Keys for Quotation Revisions
ALTER TABLE "quotation_revisions" ADD CONSTRAINT "quotation_revisions_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quotation_revisions" ADD CONSTRAINT "quotation_revisions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_current_revision_id_fkey" FOREIGN KEY ("current_revision_id") REFERENCES "quotation_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign Keys for Quotation Revision Items
ALTER TABLE "quotation_revision_items" ADD CONSTRAINT "quotation_revision_items_quotation_revision_id_fkey" FOREIGN KEY ("quotation_revision_id") REFERENCES "quotation_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quotation_revision_items" ADD CONSTRAINT "quotation_revision_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Foreign Keys for Negotiations
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign Keys for Negotiation Offers
ALTER TABLE "negotiation_offers" ADD CONSTRAINT "negotiation_offers_negotiation_id_fkey" FOREIGN KEY ("negotiation_id") REFERENCES "negotiations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "negotiation_offers" ADD CONSTRAINT "negotiation_offers_base_revision_id_fkey" FOREIGN KEY ("base_revision_id") REFERENCES "quotation_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign Keys for Negotiation Offer Items
ALTER TABLE "negotiation_offer_items" ADD CONSTRAINT "negotiation_offer_items_negotiation_offer_id_fkey" FOREIGN KEY ("negotiation_offer_id") REFERENCES "negotiation_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "negotiation_offer_items" ADD CONSTRAINT "negotiation_offer_items_quotation_item_id_fkey" FOREIGN KEY ("quotation_item_id") REFERENCES "quotation_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "negotiation_offer_items" ADD CONSTRAINT "negotiation_offer_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
