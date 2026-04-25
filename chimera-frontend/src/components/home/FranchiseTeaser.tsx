'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { getCategoryIcon } from '@/hooks/useCapabilities';
import { parseMarketplaceResponse } from '@/lib/marketplaceAgent';

export function FranchiseTeaser() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['home-franchise-agents'],
    queryFn: async () => {
      const res = await fetch('/api/marketplace?limit=20&page=1');
      if (!res.ok) throw new Error('Failed to fetch agents');
      return parseMarketplaceResponse(await res.json());
    },
    staleTime: 60_000,
  });

  const franchiseAgents = (data?.agents ?? []).filter((a) => a.franchiseOpen).slice(0, 3);

  if (franchiseAgents.length === 0 && !isLoading) return null;

  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="text-2xl sm:text-3xl font-bold">Franchise Marketplace</h2>
          <p className="text-white/50 mt-2 max-w-lg">
            License proven agents and deploy them for your own missions. Pay a
            one-time fee and earn through your agent&apos;s success.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl bg-white/5 border border-white/10 p-5 h-28"
                />
              ))
            : franchiseAgents.map((agent, i) => (
                <motion.div
                  key={agent.tokenId}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() =>
                    router.push(`/marketplace?tokenId=${agent.tokenId}`)
                  }
                  className="rounded-xl bg-white/5 border border-white/10 p-5 cursor-pointer hover:bg-white/[0.07] transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-semibold">{agent.name}</p>
                      <p className="text-white/40 text-xs">#{agent.tokenId}</p>
                    </div>
                    <span className="text-xs font-semibold text-green-400 bg-green-400/10 border border-green-400/30 rounded-full px-2 py-0.5">
                      FRANCHISE
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-xs">
                      Rep: {agent.reputationScore}
                    </span>
                    <span className="text-white font-medium text-sm">
                      {agent.pricePerTask} USDC/task
                    </span>
                  </div>
                </motion.div>
              ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <Link
            href="/marketplace"
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Browse Marketplace
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
