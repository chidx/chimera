'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { AgentCard } from '@/components/AgentCard';
import {
  useCapabilityResolution,
  getCategoryColor,
  getCategoryIcon,
} from '@/hooks/useCapabilities';
import { parseMarketplaceResponse, type MarketplaceAgent } from '@/lib/marketplaceAgent';

const COMPOSER_ADDRESS = process.env.NEXT_PUBLIC_AGENT_COMPOSER as `0x${string}`;

const COMPOSER_ABI = [
  {
    name: 'composeChimera',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'agentTokenIds', type: 'uint256[]' },
    ],
    outputs: [{ name: 'chimeraId', type: 'uint256' }],
  },
] as const;

const SLOT_LABELS = ['Scout', 'Analyzer', 'Executor', 'Support', 'Commander'];
const MAX_AGENTS = 5;

function useConflictCheck(agents: MarketplaceAgent[]): boolean {
  const primaryCapIds = [...new Set(agents.map((a) => a.capabilityIds[0]).filter(Boolean))];
  const { data: resolved = [] } = useCapabilityResolution(primaryCapIds);
  const categoryMap = new Map(resolved.map((cap) => [cap.id, cap.category]));

  const catCounts = new Map<string, number>();
  for (const agent of agents) {
    const cat = agent.capabilityIds[0] ? categoryMap.get(agent.capabilityIds[0]) : null;
    if (cat) catCounts.set(cat, (catCounts.get(cat) ?? 0) + 1);
  }
  return [...catCounts.values()].some((c) => c > 1);
}

function AgentSlotFilled({
  agent,
  label,
  onRemove,
}: {
  agent: MarketplaceAgent;
  label: string;
  onRemove: () => void;
}) {
  const { data: capabilities = [] } = useCapabilityResolution(agent.capabilityIds.slice(0, 3));
  const primary = capabilities[0] ?? null;
  const gradient = getCategoryColor(primary?.category ?? null);
  const icon = getCategoryIcon(primary?.category ?? null);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`rounded-xl border border-white/10 bg-gradient-to-br ${gradient} p-4 flex items-center gap-4`}
    >
      <div className="text-white/50 text-xs uppercase tracking-wider w-20 shrink-0 font-semibold">
        {label}
      </div>
      <div className="text-2xl shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold truncate">{agent.name}</p>
        <p className="text-white/50 text-xs mb-1">#{agent.tokenId}</p>
        <div className="flex flex-wrap gap-1">
          {capabilities.map((cap) => (
            <span key={cap.id} className="text-xs bg-white/10 text-white/70 rounded-full px-2 py-0.5">
              {cap.label}
            </span>
          ))}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-white font-semibold">{agent.reputationScore}</p>
        <p className="text-white/40 text-xs mb-2">REP</p>
        <button
          onClick={onRemove}
          className="text-white/40 hover:text-red-400 transition-colors text-xs font-medium"
        >
          Remove
        </button>
      </div>
    </motion.div>
  );
}

function BrowseModal({
  selectedTokenIds,
  onAdd,
  onClose,
}: {
  selectedTokenIds: Set<number>;
  onAdd: (agent: MarketplaceAgent) => void;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['compose-browse', page],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace?page=${page}&limit=12`);
      if (!res.ok) throw new Error('Failed to fetch agents');
      return parseMarketplaceResponse(await res.json());
    },
  });

  const agents = data?.agents ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / 12));

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-gray-950 border border-white/10 rounded-2xl w-full max-w-3xl flex flex-col overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 2rem)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
            <h2 className="text-white font-bold text-lg">Browse Agents</h2>
            <button
              onClick={onClose}
              className="text-white/50 hover:text-white transition-colors text-2xl leading-none"
            >
              &times;
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-white/5 border border-white/10 h-40 animate-pulse"
                  />
                ))}
              </div>
            ) : agents.length === 0 ? (
              <p className="text-center text-white/40 py-16">No agents found</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => {
                  const already = selectedTokenIds.has(agent.tokenId);
                  return (
                    <div key={agent.tokenId} className="relative">
                      <AgentCard
                        tokenId={agent.tokenId}
                        name={agent.name}
                        capabilityIds={agent.capabilityIds}
                        reputationScore={agent.reputationScore}
                        tasksCompleted={agent.tasksCompleted}
                        pricePerTask={agent.pricePerTask}
                        franchiseOpen={agent.franchiseOpen}
                        onClick={() => {
                          if (!already) {
                            onAdd(agent);
                            onClose();
                          }
                        }}
                      />
                      {already && (
                        <div className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center pointer-events-none">
                          <span className="text-white text-sm font-semibold bg-indigo-600 rounded-full px-3 py-1">
                            Added
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 p-4 border-t border-white/10 shrink-0">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm transition-colors"
              >
                Prev
              </button>
              <span className="text-white/50 text-sm">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}

export default function ComposePage() {
  const [selectedAgents, setSelectedAgents] = useState<MarketplaceAgent[]>([]);
  const [chimeraName, setChimeraName] = useState('');
  const [browseOpen, setBrowseOpen] = useState(false);

  useEffect(() => {
    try {
      const stored: MarketplaceAgent[] = JSON.parse(
        localStorage.getItem('chimera:compose') ?? '[]',
      );
      setSelectedAgents(stored.slice(0, MAX_AGENTS));
    } catch {
      // ignore corrupt localStorage
    }
  }, []);

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  const composing = isPending || isConfirming;
  const hasConflict = useConflictCheck(selectedAgents);
  const canCompose =
    selectedAgents.length >= 2 && chimeraName.trim().length > 0 && !composing && !isSuccess;

  const addAgent = (agent: MarketplaceAgent) => {
    setSelectedAgents((prev) => {
      if (prev.length >= MAX_AGENTS || prev.some((a) => a.tokenId === agent.tokenId)) return prev;
      const next = [...prev, agent];
      localStorage.setItem('chimera:compose', JSON.stringify(next));
      return next;
    });
  };

  const removeAgent = (tokenId: number) => {
    setSelectedAgents((prev) => {
      const next = prev.filter((a) => a.tokenId !== tokenId);
      localStorage.setItem('chimera:compose', JSON.stringify(next));
      return next;
    });
  };

  const handleCompose = () => {
    writeContract({
      address: COMPOSER_ADDRESS,
      abi: COMPOSER_ABI,
      functionName: 'composeChimera',
      args: [chimeraName.trim(), selectedAgents.map((a) => BigInt(a.tokenId))],
    });
  };

  useEffect(() => {
    if (isSuccess) {
      localStorage.removeItem('chimera:compose');
    }
  }, [isSuccess]);

  const txError = writeError ?? receiptError;
  const selectedTokenIds = new Set(selectedAgents.map((a) => a.tokenId));

  // At least 3 slots visible; grow as agents are added; cap at MAX_AGENTS
  const visibleSlotCount = Math.min(Math.max(selectedAgents.length + 1, 3), MAX_AGENTS);

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="text-7xl mb-6">🦁</div>
          <h1 className="text-3xl font-bold mb-2">Chimera Composed!</h1>
          <p className="text-white/60 mb-1">
            <span className="text-white font-semibold">{chimeraName}</span> is ready to deploy.
          </p>
          <p className="text-white/40 text-sm mb-8">
            Transaction confirmed. Your chimera is registered on-chain.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/missions"
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold transition-colors"
            >
              Launch Mission
            </Link>
            <Link
              href="/marketplace"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
            >
              Back to Marketplace
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-white/10 sticky top-0 bg-gray-950 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link
            href="/marketplace"
            className="shrink-0 text-white/60 hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            <span aria-hidden>←</span>
            <span>Marketplace</span>
          </Link>
          <h1 className="font-bold text-xl text-center min-w-0">Compose Your Chimera</h1>
          <div className="w-28 shrink-0" aria-hidden />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
        {/* Chimera name */}
        <div>
          <label className="block text-white/50 text-xs uppercase tracking-wider mb-2">
            Chimera Name
          </label>
          <input
            type="text"
            value={chimeraName}
            onChange={(e) => setChimeraName(e.target.value)}
            placeholder="e.g. AlphaRecon"
            maxLength={64}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 text-lg font-semibold transition-colors"
          />
        </div>

        {/* Compatibility warning */}
        <AnimatePresence>
          {hasConflict && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 bg-yellow-900/20 border border-yellow-500/30 rounded-xl px-4 py-3">
                <span aria-hidden>⚠️</span>
                <p className="text-yellow-300 text-sm">
                  Two agents share the same role — consider diversifying
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Agent slots */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/50 text-xs uppercase tracking-wider">
              Agents ({selectedAgents.length}/{MAX_AGENTS})
            </span>
            {selectedAgents.length < MAX_AGENTS && (
              <button
                onClick={() => setBrowseOpen(true)}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-semibold"
              >
                Browse Agents
              </button>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {Array.from({ length: visibleSlotCount }, (_, idx) => {
                const agent = selectedAgents[idx] ?? null;
                const label = SLOT_LABELS[idx];

                if (agent) {
                  return (
                    <AgentSlotFilled
                      key={agent.tokenId}
                      agent={agent}
                      label={label}
                      onRemove={() => removeAgent(agent.tokenId)}
                    />
                  );
                }

                return (
                  <motion.button
                    key={`empty-${idx}`}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setBrowseOpen(true)}
                    className="w-full rounded-xl border border-dashed border-white/20 bg-white/[0.02] hover:bg-white/5 hover:border-white/30 transition-colors p-4 flex items-center gap-4 text-left"
                  >
                    <span className="text-white/40 text-xs uppercase tracking-wider w-20 shrink-0 font-semibold">
                      {label}
                    </span>
                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center text-white/30 shrink-0">
                      +
                    </div>
                    <span className="text-white/40 text-sm">Add Agent</span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Transaction error */}
        <AnimatePresence>
          {txError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3"
            >
              <p className="text-red-400 text-sm break-words">{txError.message}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleCompose}
            disabled={!canCompose}
            className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg transition-colors flex items-center justify-center gap-2"
          >
            {composing ? (
              <>
                <svg className="animate-spin w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {isPending ? 'Confirm in Wallet…' : 'Confirming…'}
              </>
            ) : (
              'Compose Chimera'
            )}
          </button>

          {selectedAgents.length < 2 && (
            <p className="text-white/40 text-sm text-center">
              Select at least 2 agents to compose a Chimera.
            </p>
          )}
        </div>
        </div>
      </main>

      <AnimatePresence>
        {browseOpen && (
          <BrowseModal
            selectedTokenIds={selectedTokenIds}
            onAdd={addAgent}
            onClose={() => setBrowseOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
