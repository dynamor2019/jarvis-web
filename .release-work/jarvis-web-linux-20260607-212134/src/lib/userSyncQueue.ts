import { prisma } from '@/lib/prisma';

export type UserSyncEventType = 'USER_PROFILE_UPDATED';

export interface UserSyncPayload {
  userId: string;
  version: number;
  userType?: string;
  licenseType?: string;
  source: 'admin_panel';
  updatedBy: string;
}

export interface UserSyncTaskRow {
  id: string;
  userId: string;
  eventType: UserSyncEventType;
  payload: string;
  status: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  ackedAt: string | null;
}

let tableReady = false;

async function ensureQueueTable(): Promise<void> {
  if (tableReady) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS user_sync_tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      retry_count INTEGER NOT NULL DEFAULT 0,
      next_retry_at TEXT NULL,
      last_error TEXT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      acked_at TEXT NULL
    )
  `);

  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS idx_user_sync_tasks_user_status_created ON user_sync_tasks(user_id, status, created_at)`
  );

  tableReady = true;
}

export async function enqueueUserSyncTask(
  userId: string,
  eventType: UserSyncEventType,
  payload: UserSyncPayload
): Promise<string> {
  await ensureQueueTable();
  const taskId = crypto.randomUUID();
  const payloadText = JSON.stringify(payload);
  await prisma.$executeRawUnsafe(
    `INSERT INTO user_sync_tasks (id, user_id, event_type, payload, status, retry_count, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'pending', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    taskId,
    userId,
    eventType,
    payloadText
  );
  return taskId;
}

export async function pullPendingUserSyncTasks(
  userId: string,
  limit = 20
): Promise<UserSyncTaskRow[]> {
  await ensureQueueTable();
  const rows = await prisma.$queryRawUnsafe<UserSyncTaskRow[]>(
    `SELECT
       id AS id,
       user_id AS userId,
       event_type AS eventType,
       payload AS payload,
       status AS status,
       retry_count AS retryCount,
       created_at AS createdAt,
       updated_at AS updatedAt,
       acked_at AS ackedAt
     FROM user_sync_tasks
     WHERE user_id = ? AND status = 'pending'
     ORDER BY created_at ASC
     LIMIT ?`,
    userId,
    Math.max(1, Math.min(limit, 100))
  );
  return rows;
}

export async function ackUserSyncTasks(userId: string, taskIds: string[]): Promise<number> {
  await ensureQueueTable();
  if (!taskIds.length) return 0;
  let affected = 0;
  for (const taskId of taskIds) {
    const changed = await prisma.$executeRawUnsafe(
      `UPDATE user_sync_tasks
       SET status = 'acked', acked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ? AND status = 'pending'`,
      taskId,
      userId
    );
    affected += Number(changed || 0);
  }
  return affected;
}
