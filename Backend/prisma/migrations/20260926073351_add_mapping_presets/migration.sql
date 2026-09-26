-- CreateTable
CREATE TABLE "mapping_presets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "industry" TEXT,
    "mappings" JSONB NOT NULL,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mapping_presets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mapping_presets_locationId_idx" ON "mapping_presets"("locationId");

-- CreateIndex
CREATE INDEX "mapping_presets_isBuiltIn_idx" ON "mapping_presets"("isBuiltIn");

-- AddForeignKey
ALTER TABLE "mapping_presets" ADD CONSTRAINT "mapping_presets_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
