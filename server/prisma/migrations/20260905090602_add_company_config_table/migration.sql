-- CreateTable
CREATE TABLE "company_configs" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "config_key" TEXT NOT NULL,
    "config_value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_configs_companyId_idx" ON "company_configs"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "company_configs_companyId_config_key_key" ON "company_configs"("companyId", "config_key");

-- AddForeignKey
ALTER TABLE "company_configs" ADD CONSTRAINT "company_configs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
