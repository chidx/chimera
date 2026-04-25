'use client';

import { motion } from 'framer-motion';
import {
  useCapabilityResolution,
  getCategoryColor,
  getCategoryIcon,
} from '@/hooks/useCapabilities';

function formatStat(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }
  return String(value);
}

function formatUsdcAmountLine(pricePerTask: string | undefined | null): string {
  if (pricePerTask == null || pricePerTask === '—' || !String(pricePerTask).trim()) {
    return '—';
  }
  const n = Number(pricePerTask);
  if (Number.isNaN(n)) return pricePerTask;
  if (n === 0) return '0';
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

interface AgentCardProps {
  tokenId: number;
  name: string;
  capabilityIds: string[];
  reputationScore: number;
  tasksCompleted: number;
  pricePerTask: string;
  franchiseOpen: boolean;
  onClick?: () => void;
}

export function AgentCard({
  tokenId,
  name,
  capabilityIds,
  reputationScore,
  tasksCompleted,
  pricePerTask,
  franchiseOpen,
  onClick,
}: AgentCardProps) {
  const { data: capabilities = [], isLoading } = useCapabilityResolution(capabilityIds);

  const primary = capabilities[0] ?? null;
  const gradientColor = getCategoryColor(primary?.category ?? null);
  const icon = getCategoryIcon(primary?.category ?? null);
  const usdcAmount = formatUsdcAmountLine(pricePerTask);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      onClick={onClick}
      className={`bg-gradient-to-br ${gradientColor} rounded-xl p-4 border border-white/10 cursor-pointer`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{icon}</span>
        {franchiseOpen && (
          <span className="text-xs font-semibold text-green-400 bg-green-400/10 border border-green-400/30 rounded-full px-2 py-0.5">
            FRANCHISE OPEN
          </span>
        )}
      </div>

      <p className="text-white font-bold text-lg leading-tight">{name}</p>
      <p className="text-white/50 text-xs mb-3">#{tokenId}</p>

      <div className="flex flex-wrap gap-1 mb-4">
        {isLoading ? (
          <span className="text-xs bg-white/10 text-white/70 rounded-full px-2 py-0.5">
            Loading...
          </span>
        ) : (
          capabilities.map((cap) => (
            <span
              key={cap.id}
              className="text-xs bg-white/10 text-white/70 rounded-full px-2 py-0.5"
            >
              {cap.label}
            </span>
          ))
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { label: 'REP', value: formatStat(reputationScore) },
          { label: 'TASKS', value: formatStat(tasksCompleted) },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="text-white/50 text-xs">{label}</p>
            <p className="text-white font-semibold text-sm">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-end justify-between gap-2">
        <p
          className="text-white/50 text-xs text-left max-w-[55%] leading-tight"
          title="How many USDC you pay this agent for each task they complete."
        >
          Task price
        </p>
        <p className="text-white font-medium text-sm tabular-nums text-right">
          {usdcAmount}
          {usdcAmount !== '—' && (
            <>
              &nbsp;
              <abbr
                className="no-underline cursor-help text-white/95 border-b border-dotted border-white/25"
                title="USDC: USD Coin, a $1 U.S. dollar stablecoin. Used here as on-chain pay for each task—similar to how many apps use dollars, but on Base/Ethereum."
              >
                USDC
              </abbr>
            </>
          )}
        </p>
      </div>
    </motion.div>
  );
}
