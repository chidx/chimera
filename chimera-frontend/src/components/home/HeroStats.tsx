'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

const stats = [
  {
    label: 'Agents Registered',
    key: 'agents',
    queryKey: ['home-stats-agents'],
    queryFn: async () => {
      const res = await fetch('/api/marketplace?limit=1&page=1');
      if (!res.ok) return 0;
      const data = await res.json();
      return (data.total as number) ?? 0;
    },
  },
  {
    label: 'Missions Completed',
    key: 'missions',
    queryKey: ['home-stats-missions'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboard/agents');
      if (!res.ok) return 0;
      const data = await res.json();
      return (data.agents as { tasksDone: number }[]).reduce(
        (sum, a) => sum + a.tasksDone,
        0,
      );
    },
  },
  {
    label: 'Avg Reputation',
    key: 'reputation',
    queryKey: ['home-stats-rep'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboard/agents');
      if (!res.ok) return 0;
      const data = await res.json();
      const agents = data.agents as { reputation: number }[];
      if (agents.length === 0) return 0;
      return Math.round(agents.reduce((s, a) => s + a.reputation, 0) / agents.length);
    },
  },
];

function SkeletonBox() {
  return (
    <div className="animate-pulse h-20 rounded-xl bg-white/5 border border-white/10" />
  );
}

export function HeroStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 max-w-2xl mx-auto">
      {stats.map((stat, i) => (
        <StatBox key={stat.key} stat={stat} index={i} />
      ))}
    </div>
  );
}

function StatBox({
  stat,
  index,
}: {
  stat: (typeof stats)[number];
  index: number;
}) {
  const { data, isLoading } = useQuery({
    queryKey: stat.queryKey,
    queryFn: stat.queryFn,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="rounded-xl bg-white/5 border border-white/10 p-4 text-center"
    >
      {isLoading ? (
        <SkeletonBox />
      ) : (
        <>
          <p className="text-white/50 text-xs uppercase tracking-wider mb-1">
            {stat.label}
          </p>
          <p className="text-2xl font-bold text-white">
            {typeof data === 'number' ? data.toLocaleString() : '—'}
          </p>
        </>
      )}
    </motion.div>
  );
}
