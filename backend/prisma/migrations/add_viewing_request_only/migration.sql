-- CreateTable
CREATE TABLE "ViewingRequest" (
    "id" SERIAL NOT NULL,
    "propertyId" BIGINT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "requestedDateTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ViewingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ViewingRequest_propertyId_idx" ON "ViewingRequest"("propertyId");

-- CreateIndex
CREATE INDEX "ViewingRequest_tenantId_idx" ON "ViewingRequest"("tenantId");

-- CreateIndex
CREATE INDEX "ViewingRequest_landlordId_idx" ON "ViewingRequest"("landlordId");

-- CreateIndex
CREATE INDEX "ViewingRequest_status_idx" ON "ViewingRequest"("status");

-- CreateIndex
CREATE INDEX "ViewingRequest_requestedDateTime_idx" ON "ViewingRequest"("requestedDateTime"); 