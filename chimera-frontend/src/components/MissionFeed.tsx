'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Ably from 'ably';
import { useCapabilityResolution, getCategoryIcon } from '@/hooks/useCapabilities';

interface FeedEvent {
  id: string;
  fromTokenId: number;
  fromCapabilityIds: string[];
  messageType: string;
  summary: string;
  txHash?: string;
  timestamp: number;
}

function FeedEventItem({ event }: { event: FeedEvent }) {
  const { data: caps } = useCapabilityResolution(event.fromCapabilityIds);
  const icon = getCategoryIcon(caps?.[0]?.category ?? null);
  const label = caps?.[0]?.label ?? event.messageType;

  return (
    <div className="flex flex-col gap-1 px-4 py-3 border-b border-white/10">
      <div className="flex items-center gap-2 text-sm text-white/60">
        <span>{icon}</span>
        <span>
          Agent #{event.fromTokenId} · {label}
        </span>
        <span className="ml-auto text-xs text-white/40">
          {new Date(event.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <p className="text-sm text-white">{event.summary}</p>
      {event.txHash && (
        <a
          href={`https://testnet.monadexplorer.com/tx/${event.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:underline truncate"
        >
          {event.txHash}
        </a>
      )}
    </div>
  );
}

export default function MissionFeed({ missionId }: { missionId: string }) {
  const [events, setEvents] = useState<FeedEvent[]>([]);

  useEffect(() => {
    const ably = new Ably.Realtime(process.env.NEXT_PUBLIC_ABLY_KEY!);
    const channel = ably.channels.get(`mission:${missionId}`);

    channel.subscribe('agent-message', (msg) => {
      const newEvent = msg.data as FeedEvent;
      setEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
    });

    return () => {
      ably.close();
    };
  }, [missionId]);

  return (
    <div className="overflow-y-auto max-h-[480px] rounded-lg border border-white/10 bg-white/5">
      <AnimatePresence initial={false}>
        {events.map((event) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <FeedEventItem event={event} />
          </motion.div>
        ))}
      </AnimatePresence>
      {events.length === 0 && (
        <p className="text-center text-white/40 text-sm py-8">Waiting for agent activity…</p>
      )}
    </div>
  );
}
