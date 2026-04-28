'use client';

import { useEffect } from 'react';

interface SyncTask {
  id: string;
  eventType: string;
  payload?: {
    userId?: string;
    userType?: string;
    licenseType?: string;
    version?: number;
  };
}

function applyProfilePatch(task: SyncTask): boolean {
  if (task.eventType !== 'USER_PROFILE_UPDATED') return false;
  const patch = task.payload;
  if (!patch?.userId) return false;

  const raw = localStorage.getItem('user');
  if (!raw) return false;

  try {
    const user = JSON.parse(raw);
    const currentId = user?.id || user?.userId;
    if (!currentId || currentId !== patch.userId) return false;

    const nextUser = { ...user };
    if (typeof patch.userType === 'string') nextUser.userType = patch.userType;
    if (typeof patch.licenseType === 'string') nextUser.licenseType = patch.licenseType;
    if (typeof patch.version === 'number') nextUser.profileSyncVersion = patch.version;
    localStorage.setItem('user', JSON.stringify(nextUser));

    // Navbar currently refreshes auth state on focus.
    window.dispatchEvent(new Event('focus'));
    return true;
  } catch {
    return false;
  }
}

export default function UserProfileSyncClient() {
  useEffect(() => {
    let active = true;

    const runSync = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const pullRes = await fetch('/api/sync/user-profile/pull?limit=20', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const pullJson = await pullRes.json();
        if (!active || !pullJson?.success || !Array.isArray(pullJson.tasks) || pullJson.tasks.length === 0) return;

        const ackIds: string[] = [];
        for (const task of pullJson.tasks as SyncTask[]) {
          const applied = applyProfilePatch(task);
          if (applied) ackIds.push(task.id);
        }

        if (!ackIds.length) return;

        await fetch('/api/sync/user-profile/ack', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ taskIds: ackIds }),
        });
      } catch {
        // noop: background sync should never block UI
      }
    };

    runSync();
    const interval = window.setInterval(runSync, 20000);
    const onFocus = () => runSync();
    window.addEventListener('focus', onFocus);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return null;
}
