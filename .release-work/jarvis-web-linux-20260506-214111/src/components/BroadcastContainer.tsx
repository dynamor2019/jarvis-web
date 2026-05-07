'use client';

import React, { useCallback, useEffect, useState } from 'react';
import BroadcastCard from './BroadcastCard';

interface Broadcast {
  id: string;
  title: string;
  content: string;
  type: 'promotion' | 'tutorial' | 'announcement' | 'service';
  imageUrl?: string;
  actionUrl?: string;
  actionText?: string;
  displayDuration: number;
}

interface BroadcastContainerProps {
  broadcasts: Broadcast[];
}

export default function BroadcastContainer({ broadcasts }: BroadcastContainerProps) {
  const [visibleBroadcasts, setVisibleBroadcasts] = useState<Set<string>>(new Set());
  const [dismissedBroadcasts, setDismissedBroadcasts] = useState<Set<string>>(new Set());

  const handleShowBroadcast = useCallback((broadcast: Broadcast) => {
    setVisibleBroadcasts((prev) => new Set(prev).add(broadcast.id));
  }, []);

  const handleCloseBroadcast = useCallback((broadcastId: string) => {
    setVisibleBroadcasts((prev) => {
      const next = new Set(prev);
      next.delete(broadcastId);
      return next;
    });
    setDismissedBroadcasts((prev) => new Set(prev).add(broadcastId));
  }, []);

  // Show each broadcast at most once until backend list changes.
  useEffect(() => {
    broadcasts.forEach((broadcast) => {
      if (!visibleBroadcasts.has(broadcast.id) && !dismissedBroadcasts.has(broadcast.id)) {
        handleShowBroadcast(broadcast);
      }
    });
  }, [broadcasts, visibleBroadcasts, dismissedBroadcasts, handleShowBroadcast]);

  // Garbage-collect dismissed ids that are no longer in active list.
  useEffect(() => {
    setDismissedBroadcasts((prev) => {
      if (prev.size === 0) return prev;
      const activeIds = new Set(broadcasts.map((b) => b.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (activeIds.has(id)) next.add(id);
      });
      return next;
    });
  }, [broadcasts]);

  return (
    <div className="fixed bottom-6 right-6 pointer-events-none">
      <div className="flex flex-col gap-4 pointer-events-auto">
        {broadcasts.map((broadcast) =>
          visibleBroadcasts.has(broadcast.id) ? (
            <BroadcastCard
              key={broadcast.id}
              {...broadcast}
              onClose={() => handleCloseBroadcast(broadcast.id)}
            />
          ) : null
        )}
      </div>
    </div>
  );
}
