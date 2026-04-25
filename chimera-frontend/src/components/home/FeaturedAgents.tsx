'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AgentCard } from '@/components/AgentCard';
import { parseMarketplaceResponse, type MarketplaceAgent } from '@/lib/marketplaceAgent';

function SkeletonCard() {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="w-10 h-10 rounded-full bg-white/10" />
        <div className="w-24 h-5 rounded-full bg-white/10" />
      </div>
      <div className="h-5 w-3/4 rounded bg-white/10 mb-1" />
      <div className="h-3 w-1/4 rounded bg-white/10 mb-4" />
      <div className="flex gap-1 mb-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-5 w-16 rounded-full bg-white/10" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 rounded bg-white/10" />
        ))}
      </div>
      <div className="h-4 w-1/3 rounded bg-white/10 ml-auto" />
    </div>
  );
}

export function FeaturedAgents() {
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['home-featured-agents'],
    queryFn: async () => {
      const res = await fetch('/api/marketplace?limit=4&page=1');
      if (!res.ok) throw new Error('Failed to fetch agents');
      return parseMarketplaceResponse(await res.json());
    },
    staleTime: 30_000,
  });

  const agents: MarketplaceAgent[] = data?.agents ?? [];

  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-8"
        >
          <h2 className="text-2xl sm:text-3xl font-bold">Featured Agents</h2>
          <Link
            href="/leaderboard"
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View All
          </Link>
        </motion.div>

        {isError ? (
          <p className="text-white/40 text-center py-12">
            Failed to load agents.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : agents.map((agent) => (
                  <AgentCard
                    key={agent.tokenId}
                    tokenId={agent.tokenId}
                    name={agent.name}
                    capabilityIds={agent.capabilityIds}
                    reputationScore={agent.reputationScore}
                    tasksCompleted={agent.tasksCompleted}
                    pricePerTask={agent.pricePerTask}
                    franchiseOpen={agent.franchiseOpen}
                    onClick={() =>
                      router.push(`/marketplace?tokenId=${agent.tokenId}`)
                    }
                  />
                ))}
          </div>
        )}
      </div>
    </section>
  );
}
