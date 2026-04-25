'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { getCategoryColor, getCategoryIcon } from '@/hooks/useCapabilities';

interface ChimeraEntry {
  rank: number;
  name: string;
  agentTokenIds: number[];
  totalMissions: number;
  winRate: number;
}

export function HomeMissionFeed() {
  const { data, isLoading, isError } = useQuery<{ chimeras: ChimeraEntry[] }>({
    queryKey: ['home-chimeras'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboard/chimeras');
      if (!res.ok) throw new Error('Failed to fetch chimeras');
      return res.json();
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const chimeras = data?.chimeras ?? [];

  if (chimeras.length === 0 && !isLoading) return null;

  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-8"
        >
          <h2 className="text-2xl sm:text-3xl font-bold">Top Compositions</h2>
          <Link
            href="/leaderboard"
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View Leaderboard
          </Link>
        </motion.div>

        {isError ? (
          <p className="text-white/40 text-center py-12">
            Failed to load compositions.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-xl bg-white/5 border border-white/10 p-5 h-32"
                  />
                ))
              : chimeras.slice(0, 6).map((chimera, i) => (
                  <motion.div
                    key={chimera.agentTokenIds.join('-')}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-xl bg-white/5 border border-white/10 p-5 hover:bg-white/[0.07] transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-semibold">{chimera.name}</p>
                        <p className="text-white/40 text-xs mt-0.5">
                          Agents: {chimera.agentTokenIds.join(', ')}
                        </p>
                      </div>
                      <span className="text-white/30 text-xs font-mono">
                        #{chimera.rank}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-white/50 text-xs">Win Rate</p>
                        <p
                          className={`font-semibold font-mono ${
                            chimera.winRate >= 70
                              ? 'text-green-400'
                              : chimera.winRate >= 40
                                ? 'text-yellow-400'
                                : 'text-red-400'
                          }`}
                        >
                          {chimera.winRate.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-white/50 text-xs">Missions</p>
                        <p className="text-white font-semibold font-mono">
                          {chimera.totalMissions}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
          </div>
        )}
      </div>
    </section>
  );
}
