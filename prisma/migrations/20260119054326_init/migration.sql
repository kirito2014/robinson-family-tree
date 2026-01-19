-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameZh" TEXT,
    "role" TEXT NOT NULL,
    "birthDate" TEXT,
    "deathDate" TEXT,
    "location" TEXT,
    "avatar" TEXT NOT NULL,
    "bio" TEXT,
    "gender" TEXT NOT NULL,
    "isSelf" BOOLEAN NOT NULL DEFAULT false,
    "x" REAL NOT NULL DEFAULT 0,
    "y" REAL NOT NULL DEFAULT 0,
    "extra" TEXT
);

-- CreateTable
CREATE TABLE "Connection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "sourceHandle" TEXT NOT NULL,
    "targetHandle" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "labelZh" TEXT,
    "color" TEXT,
    "lineStyle" TEXT,
    "extra" TEXT,
    CONSTRAINT "Connection_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Connection_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
