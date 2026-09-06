-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "subscription_pricings" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "subscription_type" "SubscriptionType" NOT NULL,
    "customer_tier" "CustomerTier",
    "price" DECIMAL(12,2) NOT NULL,
    "min_quantity" DECIMAL(12,2) NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_pricings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "subscription_no" TEXT NOT NULL,
    "customer_id" UUID NOT NULL,
    "sales_order_id" UUID,
    "quotation_id" UUID,
    "subscription_pricing_id" UUID,
    "subscription_type" "SubscriptionType" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "next_renewal_date" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "total_recurring_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_items" (
    "id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_periods" (
    "id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "period_number" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "subscription_type" "SubscriptionType" NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "subscription_pricing_id" UUID,
    "items_snapshot" JSONB,
    "renewed_by_id" UUID,
    "renewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "subscription_periods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subscription_pricings_company_id_idx" ON "subscription_pricings"("company_id");

-- CreateIndex
CREATE INDEX "subscription_pricings_product_id_idx" ON "subscription_pricings"("product_id");

-- CreateIndex
CREATE INDEX "subscription_pricings_subscription_type_idx" ON "subscription_pricings"("subscription_type");

-- CreateIndex
CREATE INDEX "subscription_pricings_customer_tier_idx" ON "subscription_pricings"("customer_tier");

-- CreateIndex
CREATE INDEX "subscription_pricings_is_active_idx" ON "subscription_pricings"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_subscription_no_key" ON "subscriptions"("subscription_no");

-- CreateIndex
CREATE INDEX "subscriptions_company_id_idx" ON "subscriptions"("company_id");

-- CreateIndex
CREATE INDEX "subscriptions_customer_id_idx" ON "subscriptions"("customer_id");

-- CreateIndex
CREATE INDEX "subscriptions_sales_order_id_idx" ON "subscriptions"("sales_order_id");

-- CreateIndex
CREATE INDEX "subscriptions_quotation_id_idx" ON "subscriptions"("quotation_id");

-- CreateIndex
CREATE INDEX "subscriptions_subscription_pricing_id_idx" ON "subscriptions"("subscription_pricing_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_subscription_type_idx" ON "subscriptions"("subscription_type");

-- CreateIndex
CREATE INDEX "subscription_items_subscription_id_idx" ON "subscription_items"("subscription_id");

-- CreateIndex
CREATE INDEX "subscription_items_product_id_idx" ON "subscription_items"("product_id");

-- CreateIndex
CREATE INDEX "subscription_periods_subscription_id_idx" ON "subscription_periods"("subscription_id");

-- CreateIndex
CREATE INDEX "subscription_periods_subscription_pricing_id_idx" ON "subscription_periods"("subscription_pricing_id");

-- CreateIndex
CREATE INDEX "subscription_periods_renewed_by_id_idx" ON "subscription_periods"("renewed_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_periods_subscription_id_period_number_key" ON "subscription_periods"("subscription_id", "period_number");

-- AddForeignKey
ALTER TABLE "subscription_pricings" ADD CONSTRAINT "subscription_pricings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_pricings" ADD CONSTRAINT "subscription_pricings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_subscription_pricing_id_fkey" FOREIGN KEY ("subscription_pricing_id") REFERENCES "subscription_pricings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_items" ADD CONSTRAINT "subscription_items_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_items" ADD CONSTRAINT "subscription_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_periods" ADD CONSTRAINT "subscription_periods_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_periods" ADD CONSTRAINT "subscription_periods_subscription_pricing_id_fkey" FOREIGN KEY ("subscription_pricing_id") REFERENCES "subscription_pricings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_periods" ADD CONSTRAINT "subscription_periods_renewed_by_id_fkey" FOREIGN KEY ("renewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
