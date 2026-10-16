/*
  Warnings:

  - You are about to alter the column `content` on the `Comment` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `content` on the `Message` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(2000)`.
  - You are about to alter the column `caption` on the `Post` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(2200)`.
  - You are about to alter the column `bio` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(300)`.

*/
-- AlterTable
ALTER TABLE "Comment" ALTER COLUMN "content" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "read" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "content" SET DATA TYPE VARCHAR(2000);

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "commentId" TEXT;

-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "caption" DROP DEFAULT,
ALTER COLUMN "caption" SET DATA TYPE VARCHAR(2200);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "bio" DROP DEFAULT,
ALTER COLUMN "bio" SET DATA TYPE VARCHAR(300),
ALTER COLUMN "avatarUrl" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Comment_postId_createdAt_idx" ON "Comment"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- CreateIndex
CREATE INDEX "Follows_followingId_idx" ON "Follows"("followingId");

-- CreateIndex
CREATE INDEX "Like_postId_idx" ON "Like"("postId");

-- CreateIndex
CREATE INDEX "Message_senderId_receiverId_createdAt_idx" ON "Message"("senderId", "receiverId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_receiverId_senderId_createdAt_idx" ON "Message"("receiverId", "senderId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_receiverId_read_createdAt_idx" ON "Notification"("receiverId", "read", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Post_authorId_createdAt_idx" ON "Post"("authorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
