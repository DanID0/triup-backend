/*
  Warnings:

  - You are about to alter the column `position` on the `Column` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - A unique constraint covering the columns `[shareToken]` on the table `Board` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,boardId]` on the table `UserBoard` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,workspaceId]` on the table `UserWorkspace` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Board_workspaceId_key";

-- DropIndex
DROP INDEX "Column_boardId_key";

-- DropIndex
DROP INDEX "Comment_taskId_key";

-- DropIndex
DROP INDEX "Task_columnId_key";

-- DropIndex
DROP INDEX "UserBoard_boardId_key";

-- DropIndex
DROP INDEX "UserBoard_userId_key";

-- DropIndex
DROP INDEX "UserWorkspace_userId_key";

-- DropIndex
DROP INDEX "UserWorkspace_workspaceId_key";

-- DropIndex
DROP INDEX "Workspace_userId_key";

-- AlterTable
ALTER TABLE "Board" ADD COLUMN     "backgroundImageUrl" TEXT,
ADD COLUMN     "shareToken" TEXT;

-- AlterTable
ALTER TABLE "Column" ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'New Column',
ALTER COLUMN "position" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "labels" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "Board_shareToken_key" ON "Board"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "UserBoard_userId_boardId_key" ON "UserBoard"("userId", "boardId");

-- CreateIndex
CREATE UNIQUE INDEX "UserWorkspace_userId_workspaceId_key" ON "UserWorkspace"("userId", "workspaceId");
