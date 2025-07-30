/*
  Warnings:

  - Changed the type of `tenantId` on the `maintenance_requests` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `landlordId` on the `maintenance_requests` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `tenantId` on the `payment_requests` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "viewingRequest_landlordId_idx";

-- DropIndex
DROP INDEX "viewingRequest_propertyId_idx";

-- DropIndex
DROP INDEX "viewingRequest_requestedDateTime_idx";

-- DropIndex
DROP INDEX "viewingRequest_status_idx";

-- DropIndex
DROP INDEX "viewingRequest_tenantId_idx";

-- AlterTable
ALTER TABLE "landlord_profiles" ADD COLUMN     "rentReminderDays" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "viewingRequestNotifications" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "maintenance_requests" DROP COLUMN "tenantId",
ADD COLUMN     "tenantId" UUID NOT NULL,
DROP COLUMN "landlordId",
ADD COLUMN     "landlordId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "payment_requests" ADD COLUMN     "month" TEXT,
DROP COLUMN "tenantId",
ADD COLUMN     "tenantId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant_profiles"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewingRequest" ADD CONSTRAINT "viewingRequest_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "landlord_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewingRequest" ADD CONSTRAINT "viewingRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewingRequest" ADD CONSTRAINT "viewingRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
