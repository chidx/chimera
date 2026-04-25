'use client';

import { use, useState } from 'react';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import MissionFeed from '@/components/MissionFeed';
import RewardSplitChart from '@/components/RewardSplitChart';
import AuthGate from '@/components/AuthGate';
import {
  useMission,
  useCompleteMission,
  useCancelMission,
} from '@/hooks/useMissionVault';

const VAULT_ADDRESS = process.env.NEXT_PUBLIC_MISSION_VAULT as `0x${string}`;

const COMPLETE_ABI = [
  {
    name: 'completeMission',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'missionId', type: 'uint256' }],
    outputs: [],
  },
] as const;

const CANCEL_ABI = [
  {
    name: 'cancelMission',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'missionId', type: 'uint256' }],
    outputs: [],
  },
] as const;

const PIPELINE_LABELS = ['Scout', 'Analyzer', 'Executor'] as const;

const STATUS_MAP = ['Active', 'Completed', 'Cancelled'] as const;
type MissionStatus = (typeof STATUS_MAP)[number];

const CATEGORY_ICONS: Record<string, string> = {
  perceiver: '🔭',
  analyzer: '📊',
  executor: '⚡',
  orchestrator: '🎯',
  validator: '🛡️',
  communicator: '📡',
};

interface AgentInfo {
  tokenId: number;
  name: string;
  capabilityIds: string[];
  category?: string;
}

interface MissionDetail {
  id: string;
  missionType: string;
  goal?: string;
  status: MissionStatus;
  client: string;
  agentTokenId: number;
  reward: string;
  deadline: number;
  agents: AgentInfo[];
  userPercent: number;
  creatorsPercent: number;
  platformPercent: number;
}

function StatusBadge({ status }: { status: MissionStatus }) {
  const colors: Record<MissionStatus, string> = {
    Active: 'bg-green-500/20 text-green-400 border-green-500/30',
    Completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${colors[status]}`}
    >
      {status === 'Active' && (
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      )}
      {status}
    </span>
  );
}

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
  isPending,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-40"
        onClick={onCancel}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-gray-950 border border-white/10 rounded-2xl p-6 w-full max-w-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
          <p className="text-white/60 text-sm mb-6">{description}</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white font-semibold text-sm transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className={`flex-1 py-2.5 rounded-xl disabled:opacity-40 text-white font-semibold text-sm transition-colors ${confirmClass}`}
            >
              {isPending ? 'Processing…' : confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

function AgentPipelineCard({ label, agent }: { label: string; agent: AgentInfo | null }) {
  const icon = agent?.category ? (CATEGORY_ICONS[agent.category] ?? '🤖') : '🤖';
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-3">
      <span className="text-white/40 text-xs uppercase tracking-wider w-16 shrink-0 font-semibold">
        {label}
      </span>
      <span className="text-xl shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">
          {agent?.name ?? 'Unknown Agent'}
        </p>
        <p className="text-white/40 text-xs">#{agent?.tokenId ?? '—'}</p>
      </div>
    </div>
  );
}

function MissionDetailContent({ id }: { id: string }) {
  const { address } = useAccount();
  const [confirmAction, setConfirmAction] = useState<'complete' | 'cancel' | null>(null);

  const { data: mission, isLoading } = useQuery<MissionDetail>({
    queryKey: ['mission', id],
    queryFn: async () => {
      const res = await fetch(`/api/missions/${id}`);
      if (!res.ok) throw new Error('Mission not found');
      return res.json();
    },
  });

  const { data: onChainData } = useMission(BigInt(id));

  const { writeContract: completeWrite, data: completeTxHash, isPending: completeIsPending } =
    useCompleteMission();
  const { writeContract: cancelWrite, data: cancelTxHash, isPending: cancelIsPending } =
    useCancelMission();

  const { isLoading: completeConfirming } = useWaitForTransactionReceipt({
    hash: completeTxHash,
  });
  const { isLoading: cancelConfirming } = useWaitForTransactionReceipt({ hash: cancelTxHash });

  const handleComplete = () => {
    completeWrite({
      address: VAULT_ADDRESS,
      abi: COMPLETE_ABI,
      functionName: 'completeMission',
      args: [BigInt(id)],
    });
    setConfirmAction(null);
  };

  const handleCancel = () => {
    cancelWrite({
      address: VAULT_ADDRESS,
      abi: CANCEL_ABI,
      functionName: 'cancelMission',
      args: [BigInt(id)],
    });
    setConfirmAction(null);
  };

  const onChainStatus =
    onChainData != null ? STATUS_MAP[Number(onChainData[4])] : undefined;
  const status: MissionStatus = onChainStatus ?? mission?.status ?? 'Active';

  const onChainDeadline = onChainData?.[3] ? Number(onChainData[3]) : undefined;
  const deadlineTs = onChainDeadline ?? mission?.deadline;
  const deadlineDate = deadlineTs ? new Date(deadlineTs * 1000) : null;

  const onChainClient = (onChainData?.[0] as string) ?? '';
  const clientAddress = onChainClient || mission?.client || '';
  const isOwner =
    !!address && !!clientAddress && clientAddress.toLowerCase() === address.toLowerCase();
  const isActive = status === 'Active';

  const agents = mission?.agents ?? [];
  const pipelineAgents = PIPELINE_LABELS.map((_, i) => agents[i] ?? null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-white/40">Loading mission…</div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4">
        <p className="text-white/60 text-lg">Mission not found.</p>
        <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm">
          Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-white/10 sticky top-0 bg-gray-950 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="shrink-0 text-white/60 hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            <span aria-hidden>←</span>
            <span>Back</span>
          </Link>
          <h1 className="font-bold text-xl min-w-0">Mission #{id}</h1>
          <div className="w-16 shrink-0" aria-hidden />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
        {/* Top: status, type, deadline */}
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={status} />
          <span className="text-white/30">·</span>
          <span className="text-white font-semibold">{mission.missionType}</span>
          {deadlineDate && (
            <>
              <span className="text-white/30">·</span>
              <span className="text-white/50 text-sm">
                {isActive ? 'Ends' : 'Ended'}{' '}
                {deadlineDate.toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </>
          )}
        </div>

        {mission.goal && (
          <p className="text-white/60 text-sm max-w-2xl leading-relaxed">{mission.goal}</p>
        )}

        {/* Middle: feed + pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-wider mb-3">Live Activity</p>
            <MissionFeed missionId={id} />
          </div>

          <div>
            <p className="text-white/50 text-xs uppercase tracking-wider mb-3">Agent Pipeline</p>
            <div className="space-y-1">
              {pipelineAgents.map((agent, i) => (
                <div key={i}>
                  <AgentPipelineCard label={PIPELINE_LABELS[i]} agent={agent} />
                  {i < pipelineAgents.length - 1 && (
                    <div className="flex justify-center py-1">
                      <div className="flex flex-col items-center">
                        <div className="w-px h-3 bg-white/20" />
                        <svg
                          width="10"
                          height="6"
                          viewBox="0 0 10 6"
                          fill="none"
                          className="text-white/20"
                        >
                          <path d="M0 0L5 6L10 0" fill="currentColor" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: reward split + action buttons */}
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex-1 w-full">
            <p className="text-white/50 text-xs uppercase tracking-wider mb-4">
              Reward Distribution
            </p>
            <div className="flex items-center justify-center">
              <RewardSplitChart
                userPercent={mission.userPercent ?? 98}
                creatorsPercent={mission.creatorsPercent ?? 1}
                platformPercent={mission.platformPercent ?? 1}
              />
            </div>
          </div>

          {isActive && isOwner && (
            <div className="flex flex-col gap-3 w-full sm:w-52 shrink-0">
              <button
                onClick={() => setConfirmAction('complete')}
                disabled={completeIsPending || completeConfirming}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
              >
                {completeIsPending || completeConfirming ? 'Processing…' : 'Complete Mission'}
              </button>
              <button
                onClick={() => setConfirmAction('cancel')}
                disabled={cancelIsPending || cancelConfirming}
                className="w-full py-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-red-400 font-semibold text-sm transition-colors"
              >
                {cancelIsPending || cancelConfirming ? 'Processing…' : 'Cancel Mission'}
              </button>
            </div>
          )}
        </div>
        </div>
      </main>

      <AnimatePresence>
        {confirmAction === 'complete' && (
          <ConfirmDialog
            title="Complete Mission"
            description="Are you sure you want to mark this mission as completed? This action cannot be undone."
            confirmLabel="Complete"
            confirmClass="bg-indigo-600 hover:bg-indigo-500"
            onConfirm={handleComplete}
            onCancel={() => setConfirmAction(null)}
            isPending={completeIsPending || completeConfirming}
          />
        )}
        {confirmAction === 'cancel' && (
          <ConfirmDialog
            title="Cancel Mission"
            description="Are you sure you want to cancel this mission? Funds will be returned to your wallet."
            confirmLabel="Cancel Mission"
            confirmClass="bg-red-600 hover:bg-red-500"
            onConfirm={handleCancel}
            onCancel={() => setConfirmAction(null)}
            isPending={cancelIsPending || cancelConfirming}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <AuthGate>
      <MissionDetailContent id={id} />
    </AuthGate>
  );
}
