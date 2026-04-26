-- CreateEnum
CREATE TYPE "BoardActivityType" AS ENUM ('COMMENT', 'TASK_CREATED', 'TASK_UPDATED', 'TASK_MOVED', 'TASK_DELETED', 'COLUMN_CREATED', 'COLUMN_UPDATED', 'COLUMN_DELETED', 'BOARD_UPDATED');

-- CreateTable
CREATE TABLE "BoardActivity" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "BoardActivityType" NOT NULL,
    "message" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoardActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BoardActivity_boardId_createdAt_idx" ON "BoardActivity"("boardId", "createdAt");

-- CreateIndex
CREATE INDEX "BoardActivity_userId_idx" ON "BoardActivity"("userId");

-- AddForeignKey
ALTER TABLE "BoardActivity" ADD CONSTRAINT "BoardActivity_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardActivity" ADD CONSTRAINT "BoardActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
