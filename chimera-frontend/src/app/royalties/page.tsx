'use client';

import AuthGate from '@/components/AuthGate';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

interface AgentRoyalty {
  tokenId: number;
  capabilityLabel: string | null;
  category: string | null;
  totalEarned: string;
  thisWeek: string;
}

interface RoyaltiesData {
  totalEarned: string;
  thisWeek: string;
  agents: AgentRoyalty[];
  chart: { week: string; earned: number }[];
}

function EarningsChart({ data }: { data: { week: string; earned: number }[] }) {
  if (data.length === 0) {
    return <p className="text-zinc-500 text-sm py-4">No earnings data yet.</p>;
  }

  const max = Math.max(...data.map((d) => d.earned), 0.000001);
  const chartH = 100;
  const slots = data.length;
  const slotW = 400 / slots;
  const barW = Math.max(slotW - 6, 4);

  return (
    <svg
      viewBox={`0 0 400 ${chartH + 28}`}
      className="w-full overflow-visible"
      aria-label="Weekly earnings chart"
    >
      {data.map((d, i) => {
        const barH = Math.max((d.earned / max) * chartH, 2);
        const x = i * slotW + (slotW - barW) / 2;
        const y = chartH - barH;
        return (
          <g key={d.week}>
            <rect x={x} y={y} width={barW} height={barH} fill="#3b82f6" rx={2} />
            <text
              x={x + barW / 2}
              y={chartH + 18}
              textAnchor="middle"
              fill="#71717a"
              fontSize={9}
            >
              {d.week.slice(5)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function RoyaltiesContent() {
  const { address } = useAccount();

  const { data, isLoading, isError } = useQuery<RoyaltiesData>({
    queryKey: ['royalties', address],
    queryFn: async () => {
      const res = await fetch(`/api/builders/${address}/royalties`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch royalties');
      return res.json();
    },
    enabled: !!address,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-zinc-800 rounded-lg" />
          <div className="h-24 bg-zinc-800 rounded-lg" />
        </div>
        <div className="h-40 bg-zinc-800 rounded-lg" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-zinc-500 py-8 text-center">
        Failed to load royalty data.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-zinc-800 p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total Earned</p>
          <p className="text-2xl font-bold font-mono">{data.totalEarned}</p>
          <p className="text-xs text-zinc-500 mt-1">USDC all time</p>
        </div>
        <div className="rounded-lg border border-zinc-800 p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">This Week</p>
          <p className="text-2xl font-bold font-mono text-blue-400">{data.thisWeek}</p>
          <p className="text-xs text-zinc-500 mt-1">USDC last 7 days</p>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 p-5">
        <h2 className="text-sm font-medium text-zinc-400 mb-4">Earnings by Week</h2>
        <EarningsChart data={data.chart} />
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-400 mb-3">Per-Agent Breakdown</h2>
        {data.agents.length === 0 ? (
          <p className="text-zinc-500 text-sm">No agent earnings yet.</p>
        ) : (
          <div className="rounded-lg border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-left">
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Capability</th>
                  <th className="px-4 py-3 text-right">Total Earned</th>
                  <th className="px-4 py-3 text-right">This Week</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {data.agents.map((agent) => (
                  <tr key={agent.tokenId} className="hover:bg-zinc-900 transition-colors">
                    <td className="px-4 py-3 font-medium">Agent #{agent.tokenId}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-300">{agent.capabilityLabel ?? '—'}</span>
                        {agent.category && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400">
                            {agent.category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-200">
                      {agent.totalEarned}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-blue-400">
                      {agent.thisWeek}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoyaltiesPage() {
  return (
    <AuthGate>
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">Royalties</h1>
        <RoyaltiesContent />
      </main>
    </AuthGate>
  );
}
