'use client';

import { useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { AgentCard } from '@/components/AgentCard';
import {
  useCapabilityList,
  useCapabilityResolution,
  getCategoryColor,
  getCategoryIcon,
  type CapabilityDefinition,
} from '@/hooks/useCapabilities';
import {
  parseMarketplaceResponse,
  type MarketplaceAgent,
} from '@/lib/marketplaceAgent';

const CATEGORIES = [
  'perceiver',
  'analyzer',
  'executor',
  'orchestrator',
  'validator',
  'communicator',
] as const;

const PAGE_SIZE = 12;

const DOMAIN_ACRONYMS: Record<string, string> = {
  nlp: 'NLP',
  iot: 'IoT',
  defi: 'DeFi',
  api: 'API',
  llm: 'LLM',
};

function formatDomainLabel(domain: string): string {
  return domain
    .split('_')
    .map((word) => {
      const lower = word.toLowerCase();
      if (DOMAIN_ACRONYMS[lower]) return DOMAIN_ACRONYMS[lower];
      if (word.length <= 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function formatAgentStat(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }
  return String(value);
}

function useMarketplaceFilters() {
  const searchParams = useSearchParams();

  const domains = searchParams.getAll('domain');
  const categories = searchParams.getAll('category');
  const minRep = searchParams.get('minRep') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const page = Number(searchParams.get('page') ?? '1');

  const setParams = useCallback(
    (updater: (p: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      updater(params);
      window.history.replaceState(null, '', `?${params.toString()}`);
    },
    [searchParams],
  );

  const toggleDomain = (domain: string) => {
    setParams((p) => {
      const existing = p.getAll('domain');
      p.delete('domain');
      if (existing.includes(domain)) {
        existing.filter((d) => d !== domain).forEach((d) => p.append('domain', d));
      } else {
        [...existing, domain].forEach((d) => p.append('domain', d));
      }
      p.set('page', '1');
    });
  };

  const toggleCategory = (category: string) => {
    setParams((p) => {
      const existing = p.getAll('category');
      p.delete('category');
      if (existing.includes(category)) {
        existing.filter((c) => c !== category).forEach((c) => p.append('category', c));
      } else {
        [...existing, category].forEach((c) => p.append('category', c));
      }
      p.set('page', '1');
    });
  };

  const setMinRep = (val: string) => {
    setParams((p) => {
      if (val) p.set('minRep', val);
      else p.delete('minRep');
      p.set('page', '1');
    });
  };

  const setMaxPrice = (val: string) => {
    setParams((p) => {
      if (val) p.set('maxPrice', val);
      else p.delete('maxPrice');
      p.set('page', '1');
    });
  };

  const setPage = (p: number) => {
    setParams((params) => params.set('page', String(p)));
  };

  const clearFilters = () => {
    window.history.replaceState(null, '', '?');
  };

  return {
    domains,
    categories,
    minRep,
    maxPrice,
    page,
    toggleDomain,
    toggleCategory,
    setMinRep,
    setMaxPrice,
    setPage,
    clearFilters,
  };
}

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
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-8 rounded bg-white/10" />
        ))}
      </div>
      <div className="h-4 w-1/3 rounded bg-white/10 ml-auto" />
    </div>
  );
}

function AgentSheet({
  agent,
  onClose,
}: {
  agent: MarketplaceAgent;
  onClose: () => void;
}) {
  const { data: capabilities = [], isLoading } = useCapabilityResolution(agent.capabilityIds);

  const recruit = () => {
    const existing: MarketplaceAgent[] = JSON.parse(localStorage.getItem('chimera:compose') ?? '[]');
    if (!existing.find((a) => a.tokenId === agent.tokenId)) {
      localStorage.setItem('chimera:compose', JSON.stringify([...existing, agent]));
    }
    onClose();
  };

  return (
    <>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />
      <motion.aside
        key="sheet"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-950 border-l border-white/10 z-50 flex flex-col overflow-y-auto"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 bg-gray-950">
          <h2 className="text-white font-bold text-lg">Agent Details</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 p-5 space-y-6">
          <div>
            <p className="text-white/50 text-xs mb-1">#{agent.tokenId}</p>
            <h3 className="text-white font-bold text-2xl">{agent.name}</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Reputation', value: formatAgentStat(agent.reputationScore) },
              { label: 'Tasks', value: formatAgentStat(agent.tasksCompleted) },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-white/5 rounded-lg p-3 text-center border border-white/10"
              >
                <p className="text-white/50 text-xs mb-1">{label}</p>
                <p className="text-white font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Capabilities</p>
            <div className="flex flex-wrap gap-2">
              {isLoading ? (
                <span className="text-xs bg-white/10 text-white/60 rounded-full px-3 py-1">
                  Loading...
                </span>
              ) : capabilities.length === 0 ? (
                <span className="text-xs text-white/40">None listed</span>
              ) : (
                capabilities.map((cap) => (
                  <span
                    key={cap.id}
                    className={`text-xs rounded-full px-3 py-1 bg-gradient-to-r ${getCategoryColor(cap.category)} text-white border border-white/10`}
                  >
                    {getCategoryIcon(cap.category)} {cap.label}
                  </span>
                ))
              )}
            </div>
          </div>

          {agent.franchiseOpen && agent.franchiseTerms && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
              <p className="text-green-400 text-xs uppercase tracking-wider font-semibold mb-3">
                Franchise Terms
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-white/50 text-xs mb-1">Price per Task</p>
                  <p className="text-white font-semibold">
                    {agent.franchiseTerms.pricePerTask} USDC
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-xs mb-1">Royalty</p>
                  <p className="text-white font-semibold">
                    {agent.franchiseTerms.royaltyPercent}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {!agent.franchiseOpen && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/50 text-xs uppercase tracking-wider font-semibold mb-1">
                Direct Hire
              </p>
              <p className="text-white font-semibold">
                {agent.pricePerTask === '—'
                  ? '—'
                  : `${agent.pricePerTask} USDC per task`}
              </p>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-white/10 sticky bottom-0 bg-gray-950">
          <button
            onClick={recruit}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold transition-colors"
          >
            Recruit Agent
          </button>
        </div>
      </motion.aside>
    </>
  );
}

function FilterSidebar({
  domains,
  selectedDomains,
  selectedCategories,
  minRep,
  maxPrice,
  onToggleDomain,
  onToggleCategory,
  onMinRep,
  onMaxPrice,
  onClear,
}: {
  domains: string[];
  selectedDomains: string[];
  selectedCategories: string[];
  minRep: string;
  maxPrice: string;
  onToggleDomain: (d: string) => void;
  onToggleCategory: (c: string) => void;
  onMinRep: (v: string) => void;
  onMaxPrice: (v: string) => void;
  onClear: () => void;
}) {
  const hasFilters =
    selectedDomains.length > 0 ||
    selectedCategories.length > 0 ||
    minRep !== '' ||
    maxPrice !== '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Filters</h2>
        {hasFilters && (
          <button
            onClick={onClear}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div>
        <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Domain</p>
        <div className="flex flex-col gap-1">
          {domains.map((domain) => (
            <button
              key={domain}
              onClick={() => onToggleDomain(domain)}
              className={`text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                selectedDomains.includes(domain)
                  ? 'bg-indigo-600 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {formatDomainLabel(domain)}
            </button>
          ))}
          {domains.length === 0 && (
            <p className="text-white/30 text-xs">No domains available</p>
          )}
        </div>
      </div>

      <div>
        <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Category</p>
        <div className="flex flex-col gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onToggleCategory(cat)}
              className={`text-left text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                selectedCategories.includes(cat)
                  ? 'bg-indigo-600 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{getCategoryIcon(cat)}</span>
              <span className="capitalize">{cat}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Min Reputation</p>
        <input
          type="number"
          min={0}
          value={minRep}
          onChange={(e) => onMinRep(e.target.value)}
          placeholder="0"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Max Price per Task (USDC)</p>
        <input
          type="number"
          min={0}
          value={maxPrice}
          onChange={(e) => onMaxPrice(e.target.value)}
          placeholder="Any"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>
  );
}

export default function MarketplacePageWrapper() {
  return (
    <Suspense>
      <MarketplacePage />
    </Suspense>
  );
}

function MarketplacePage() {
  const searchParams = useSearchParams();
  const filters = useMarketplaceFilters();
  const [selectedAgent, setSelectedAgent] = useState<MarketplaceAgent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: capabilities } = useCapabilityList();
  const uniqueDomains = Array.from(
    new Set((capabilities ?? []).map((c) => c.domain).filter(Boolean) as string[]),
  );

  const fetchUrl = (() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('limit', String(PAGE_SIZE));
    const minRepQ = params.get('minRep');
    if (minRepQ) {
      params.set('minReputation', minRepQ);
      params.delete('minRep');
    }
    return `/api/marketplace?${params.toString()}`;
  })();

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['marketplace', searchParams.toString(), PAGE_SIZE],
    queryFn: async () => {
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error('Failed to fetch agents');
      return parseMarketplaceResponse(await res.json());
    },
  });

  const agents = data?.agents ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 bg-gray-950 z-30">
        <div className="flex items-center gap-3">
          <button
            className="sm:hidden text-white/60 hover:text-white transition-colors"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open filters"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 className="font-bold text-xl">Agent Marketplace</h1>
          {total > 0 && (
            <span className="text-white/40 text-sm hidden sm:inline">{total} agents</span>
          )}
        </div>
        <Link
          href="/builder"
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm transition-colors"
        >
          Forge Agent
        </Link>
      </header>

      <div className="flex max-w-screen-xl mx-auto">
        <aside className="hidden sm:block w-56 shrink-0 p-6 border-r border-white/10 min-h-[calc(100vh-65px)] sticky top-[65px] self-start overflow-y-auto max-h-[calc(100vh-65px)]">
          <FilterSidebar
            domains={uniqueDomains}
            selectedDomains={filters.domains}
            selectedCategories={filters.categories}
            minRep={filters.minRep}
            maxPrice={filters.maxPrice}
            onToggleDomain={filters.toggleDomain}
            onToggleCategory={filters.toggleCategory}
            onMinRep={filters.setMinRep}
            onMaxPrice={filters.setMaxPrice}
            onClear={filters.clearFilters}
          />
        </aside>

        <main className="flex-1 p-4 sm:p-6">
          {isError ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-4xl mb-4">⚠️</p>
              <p className="text-white/60">Failed to load agents. Check your connection.</p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-6xl mb-4">🤖</p>
              <p className="text-white font-semibold text-lg mb-2">No agents found</p>
              <p className="text-white/40 text-sm max-w-xs">
                Try adjusting your filters or check back later as new agents join the marketplace.
              </p>
              <button
                onClick={filters.clearFilters}
                className="mt-6 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <AgentCard
                    key={agent.tokenId}
                    tokenId={agent.tokenId}
                    name={agent.name}
                    capabilityIds={agent.capabilityIds}
                    reputationScore={agent.reputationScore}
                    tasksCompleted={agent.tasksCompleted}
                    pricePerTask={agent.pricePerTask}
                    franchiseOpen={agent.franchiseOpen}
                    onClick={() => setSelectedAgent(agent)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button
                    onClick={() => filters.setPage(filters.page - 1)}
                    disabled={filters.page <= 1}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm transition-colors"
                  >
                    Prev
                  </button>
                  <span className="text-white/50 text-sm">
                    {filters.page} / {totalPages}
                  </span>
                  <button
                    onClick={() => filters.setPage(filters.page + 1)}
                    disabled={filters.page >= totalPages}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <AnimatePresence>
        {selectedAgent && (
          <AgentSheet agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="filter-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 sm:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              key="filter-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-full w-72 bg-gray-950 border-r border-white/10 z-50 p-6 overflow-y-auto sm:hidden"
            >
              <FilterSidebar
                domains={uniqueDomains}
                selectedDomains={filters.domains}
                selectedCategories={filters.categories}
                minRep={filters.minRep}
                maxPrice={filters.maxPrice}
                onToggleDomain={filters.toggleDomain}
                onToggleCategory={filters.toggleCategory}
                onMinRep={filters.setMinRep}
                onMaxPrice={filters.setMaxPrice}
                onClear={() => {
                  filters.clearFilters();
                  setDrawerOpen(false);
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
