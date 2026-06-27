import { prisma } from './prisma';

/**
 * Ensures legacy SQLite databases have the support ticket tables before use.
 */
export async function ensureSupportTicketTables(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SupportTicket" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "category" TEXT NOT NULL DEFAULT 'other',
      "content" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "adminReply" TEXT,
      "repliedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SupportTicketReply" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "ticketId" TEXT NOT NULL,
      "authorId" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'admin',
      "content" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SupportTicketReply_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "SupportTicketReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "SupportTicket_userId_idx" ON "SupportTicket"("userId")');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "SupportTicket_status_idx" ON "SupportTicket"("status")');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt")');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "SupportTicketReply_ticketId_idx" ON "SupportTicketReply"("ticketId")');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "SupportTicketReply_authorId_idx" ON "SupportTicketReply"("authorId")');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "SupportTicketReply_createdAt_idx" ON "SupportTicketReply"("createdAt")');
}
