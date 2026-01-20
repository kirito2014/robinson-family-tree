/*
  Warnings:

  - You are about to drop the column `extra` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `isSelf` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `nameZh` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `x` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `y` on the `Member` table. All the data in the column will be lost.
  - You are about to alter the column `birthDate` on the `Member` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `deathDate` on the `Member` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to drop the column `color` on the `Connection` table. All the data in the column will be lost.
  - You are about to drop the column `extra` on the `Connection` table. All the data in the column will be lost.
  - You are about to drop the column `label` on the `Connection` table. All the data in the column will be lost.
  - You are about to drop the column `labelZh` on the `Connection` table. All the data in the column will be lost.
  - You are about to drop the column `lineStyle` on the `Connection` table. All the data in the column will be lost.
  - You are about to drop the column `sourceHandle` on the `Connection` table. All the data in the column will be lost.
  - You are about to drop the column `sourceId` on the `Connection` table. All the data in the column will be lost.
  - You are about to drop the column `targetHandle` on the `Connection` table. All the data in the column will be lost.
  - You are about to drop the column `targetId` on the `Connection` table. All the data in the column will be lost.
  - Added the required column `familyId` to the `Member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `Member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `familyId` to the `Connection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromId` to the `Connection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toId` to the `Connection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Connection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Connection` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "nickname" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "location" TEXT,
    "avatar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "shareCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "creatorId" TEXT NOT NULL,
    CONSTRAINT "Family_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FamilyUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FamilyUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FamilyUser_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FamilyUser_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "nickname" TEXT,
    "gender" TEXT NOT NULL DEFAULT 'male',
    "birthDate" DATETIME,
    "deathDate" DATETIME,
    "isAlive" BOOLEAN NOT NULL DEFAULT true,
    "bio" TEXT,
    "avatar" TEXT,
    "familyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Member_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Member" ("avatar", "bio", "birthDate", "deathDate", "gender", "id") SELECT "avatar", "bio", "birthDate", "deathDate", "gender", "id" FROM "Member";
DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";
CREATE TABLE "new_Connection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Connection_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Connection_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Connection_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Connection" ("id") SELECT "id" FROM "Connection";
DROP TABLE "Connection";
ALTER TABLE "new_Connection" RENAME TO "Connection";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Family_shareCode_key" ON "Family"("shareCode");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyUser_userId_familyId_key" ON "FamilyUser"("userId", "familyId");
