-- AlterTable
ALTER TABLE "users"
ADD COLUMN "cancellationReason" TEXT,
ADD COLUMN "cancellationFeedback" TEXT;

-- CreateTable
CREATE TABLE "subscription_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromPlan" TEXT,
    "toPlan" TEXT,
    "fromInterval" TEXT,
    "toInterval" TEXT,
    "mrrDelta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reason" TEXT,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subscription_events_userId_idx" ON "subscription_events"("userId");
CREATE INDEX "subscription_events_eventType_idx" ON "subscription_events"("eventType");
CREATE INDEX "subscription_events_createdAt_idx" ON "subscription_events"("createdAt");

-- AddForeignKey
ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
