'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface AgentEntry {
  rank: number;
  tokenId: number;
  capabilityLabel: string | null;
  category: string | null;
  reputation: number;
  tasksDone: number;
  franchiseOpen: boolean;
}

interface ChimeraEntry {
  rank: number;
  name: string;
  agentTokenIds: number[];
  totalMissions: number;
  winRate: number;
}

function useAgentLeaderboard() {
  return useQuery<{ agents: AgentEntry[] }>({
    queryKey: ['leaderboard', 'agents'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboard/agents');
      if (!res.ok) throw new Error('Failed to fetch agent leaderboard');
      return res.json();
    },
    refetchInterval: 30_000,
  });
}

function useChimeraLeaderboard() {
  return useQuery<{ chimeras: ChimeraEntry[] }>({
    queryKey: ['leaderboard', 'chimeras'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboard/chimeras');
      if (!res.ok) throw new Error('Failed to fetch chimera leaderboard');
      return res.json();
    },
    refetchInterval: 30_000,
  });
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-zinc-800 rounded animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  );
}

function AgentsTab() {
  const { data, isLoading, isError } = useAgentLeaderboard();

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-400 text-left">
            <th className="px-4 py-3 w-12">#</th>
            <th className="px-4 py-3">Agent</th>
            <th className="px-4 py-3">Capability</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3 text-right">Reputation</th>
            <th className="px-4 py-3 text-right">Tasks Done</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {isLoading && Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}
          {isError && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                Failed to load leaderboard.
              </td>
            </tr>
          )}
          {data?.agents.map((agent) => (
            <tr key={agent.tokenId} className="hover:bg-zinc-900 transition-colors">
              <td className="px-4 py-3 text-zinc-500 font-mono">{agent.rank}</td>
              <td className="px-4 py-3 font-medium">Agent #{agent.tokenId}</td>
              <td className="px-4 py-3 text-zinc-300">{agent.capabilityLabel ?? '—'}</td>
              <td className="px-4 py-3">
                {agent.category ? (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-300">
                    {agent.category}
                  </span>
                ) : (
                  <span className="text-zinc-600">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-right font-mono text-blue-400">{agent.reputation}</td>
              <td className="px-4 py-3 text-right font-mono text-zinc-300">{agent.tasksDone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChimerasTab() {
  const { data, isLoading, isError } = useChimeraLeaderboard();

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-400 text-left">
            <th className="px-4 py-3 w-12">#</th>
            <th className="px-4 py-3">Chimera</th>
            <th className="px-4 py-3 text-right">Win Rate</th>
            <th className="px-4 py-3 text-right">Total Missions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {isLoading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={4} />)}
          {isError && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                Failed to load leaderboard.
              </td>
            </tr>
          )}
          {data?.chimeras.map((chimera) => (
            <tr key={chimera.agentTokenIds.join('-')} className="hover:bg-zinc-900 transition-colors">
              <td className="px-4 py-3 text-zinc-500 font-mono">{chimera.rank}</td>
              <td className="px-4 py-3">
                <p className="font-medium">{chimera.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Agents: {chimera.agentTokenIds.join(', ')}
                </p>
              </td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`font-mono font-semibold ${
                    chimera.winRate >= 70
                      ? 'text-green-400'
                      : chimera.winRate >= 40
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}
                >
                  {chimera.winRate.toFixed(1)}%
                </span>
              </td>
              <td className="px-4 py-3 text-right font-mono text-zinc-300">
                {chimera.totalMissions}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type Tab = 'agents' | 'chimeras';

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>('agents');

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>

      <div className="flex gap-1 mb-6 p-1 bg-zinc-900 rounded-lg w-fit">
        {(['agents', 'chimeras'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              tab === t
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'agents' ? <AgentsTab /> : <ChimerasTab />}
    </main>
  );
}
