/*
  Warnings:

  - You are about to drop the column `message` on the `quotation_negotiations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "quotation_negotiations" DROP COLUMN "message",
ADD COLUMN     "admin_message" TEXT,
ADD COLUMN     "customer_message" TEXT;
