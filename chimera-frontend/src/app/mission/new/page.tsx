'use client';

import { useState, useEffect } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { parseUnits } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MissionTypeSelector from '@/components/MissionTypeSelector';
import RewardSplitChart from '@/components/RewardSplitChart';
import AuthGate from '@/components/AuthGate';

const VAULT_ADDRESS = process.env.NEXT_PUBLIC_MISSION_VAULT as `0x${string}`;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;

const VAULT_ABI = [
  {
    name: 'createMission',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'agentTokenId', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'metadataURI', type: 'string' },
    ],
    outputs: [{ name: 'missionId', type: 'uint256' }],
  },
] as const;

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

const DURATION_OPTIONS = [
  { label: '1 Day', value: '1d', seconds: 86_400 },
  { label: '3 Days', value: '3d', seconds: 259_200 },
  { label: '7 Days', value: '7d', seconds: 604_800 },
  { label: '14 Days', value: '14d', seconds: 1_209_600 },
  { label: '30 Days', value: '30d', seconds: 2_592_000 },
];

const PIPELINE_LABELS = ['Scout', 'Analyzer', 'Executor'];

interface AgentInfo {
  tokenId: number;
  name: string;
  capabilityIds: string[];
  franchiseTerms?: { royaltyPercent: number };
}

interface ChimeraInfo {
  tokenId: number;
  name: string;
  agents: AgentInfo[];
}

function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              i + 1 < current
                ? 'bg-indigo-600 text-white'
                : i + 1 === current
                  ? 'bg-indigo-500 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-gray-950'
                  : 'bg-white/10 text-white/40'
            }`}
          >
            {i + 1 < current ? '✓' : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-px w-10 ${i + 1 < current ? 'bg-indigo-600' : 'bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function NewMissionForm() {
  const router = useRouter();
  const { address } = useAccount();

  const [step, setStep] = useState(1);
  const [missionType, setMissionType] = useState<string | null>(null);
  const [goal, setGoal] = useState('');
  const [duration, setDuration] = useState('7d');
  const [chimera, setChimera] = useState<ChimeraInfo | null>(null);
  const [usdcAmount, setUsdcAmount] = useState('');
  const [approvalDone, setApprovalDone] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('chimera:selected');
      if (stored) setChimera(JSON.parse(stored));
    } catch {
      // ignore corrupt localStorage
    }
  }, []);

  const usdcAmountParsed = usdcAmount ? parseUnits(usdcAmount, 6) : BigInt(0);

  const { data: allowance = BigInt(0), refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, VAULT_ADDRESS] : undefined,
    query: { enabled: !!address && !!USDC_ADDRESS },
  });

  const needsApproval =
    !approvalDone &&
    usdcAmountParsed > BigInt(0) &&
    (allowance as bigint) < usdcAmountParsed;

  const {
    writeContract: approveWrite,
    data: approveTxHash,
    isPending: approveIsPending,
    error: approveWriteError,
  } = useWriteContract();

  const { isLoading: approveConfirming, isSuccess: approveSuccess } =
    useWaitForTransactionReceipt({ hash: approveTxHash });

  useEffect(() => {
    if (approveSuccess) {
      refetchAllowance();
      setApprovalDone(true);
    }
  }, [approveSuccess, refetchAllowance]);

  const {
    writeContract: createWrite,
    data: createTxHash,
    isPending: createIsPending,
    error: createWriteError,
  } = useWriteContract();

  const { isLoading: createConfirming, isSuccess: createSuccess } =
    useWaitForTransactionReceipt({ hash: createTxHash });

  useEffect(() => {
    if (createSuccess && address) {
      fetch(`/api/missions?creator=${address}&limit=1&sort=desc`)
        .then((r) => r.json())
        .then((data) => {
          const id = data?.missions?.[0]?.id;
          if (id) router.push(`/mission/${id}`);
        })
        .catch(() => {});
    }
  }, [createSuccess, address, router]);

  const selectedDuration = DURATION_OPTIONS.find((d) => d.value === duration)!;
  const deadline = BigInt(Math.floor(Date.now() / 1000) + selectedDuration.seconds);

  const totalRoyalties = chimera
    ? chimera.agents.reduce((sum, a) => sum + (a.franchiseTerms?.royaltyPercent ?? 0), 0)
    : 0;
  const platformPercent = 1;
  const creatorsPercent = totalRoyalties;
  const userPercent = Math.max(0, 100 - platformPercent - creatorsPercent);

  const metadataURI = JSON.stringify({ type: missionType, goal, duration });

  const handleApprove = () => {
    approveWrite({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [VAULT_ADDRESS, usdcAmountParsed],
    });
  };

  const handleLaunch = () => {
    if (!chimera) return;
    createWrite({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'createMission',
      args: [BigInt(chimera.tokenId), deadline, metadataURI],
      value: usdcAmountParsed,
    });
  };

  const approving = approveIsPending || approveConfirming;
  const launching = createIsPending || createConfirming;
  const txError = approveWriteError ?? createWriteError;

  if (createSuccess) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="text-7xl mb-6">🚀</div>
          <h1 className="text-3xl font-bold mb-2">Mission Launched!</h1>
          <p className="text-white/60 mb-1">Your mission is now active on-chain.</p>
          <p className="text-white/40 text-sm mb-8">Redirecting to mission details…</p>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
          >
            Go Home
          </Link>
        </motion.div>
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
          <h1 className="font-bold text-xl min-w-0">New Mission</h1>
          <div className="w-16 shrink-0" aria-hidden />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
        <StepIndicator current={step} total={4} />

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold mb-1">What type of mission?</h2>
                <p className="text-white/50 text-sm mb-6">
                  Choose a category that best fits your goal.
                </p>
                <MissionTypeSelector selected={missionType} onSelect={setMissionType} />
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!missionType}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
              >
                Continue
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold mb-1">Define your mission</h2>
                <p className="text-white/50 text-sm mb-6">
                  Describe the goal and set the timeline.
                </p>
              </div>

              <div>
                <label className="block text-white/50 text-xs uppercase tracking-wider mb-2">
                  Mission Goal
                </label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Describe what you want your Chimera to accomplish…"
                  rows={4}
                  maxLength={1000}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 resize-none transition-colors"
                />
                <p className="text-white/30 text-xs mt-1 text-right">{goal.length}/1000</p>
              </div>

              <div>
                <label className="block text-white/50 text-xs uppercase tracking-wider mb-2">
                  Duration
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDuration(opt.value)}
                      className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                        duration === opt.value
                          ? 'border-indigo-500 bg-indigo-600/20 text-white'
                          : 'border-white/20 bg-white/5 text-white/50 hover:text-white hover:border-white/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!goal.trim()}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold mb-1">Review your mission</h2>
                <p className="text-white/50 text-sm mb-6">Confirm the details before funding.</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Type</span>
                  <span className="text-white font-semibold">{missionType}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-white/50 text-sm shrink-0">Goal</span>
                  <span className="text-white text-sm text-right line-clamp-3">{goal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Duration</span>
                  <span className="text-white font-semibold">{selectedDuration.label}</span>
                </div>
              </div>

              {chimera ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/50 text-xs uppercase tracking-wider">Chimera</span>
                    <span className="text-white font-bold">
                      {chimera.name} #{chimera.tokenId}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {chimera.agents.slice(0, 3).map((agent, i) => (
                      <div key={agent.tokenId}>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
                          <span className="text-white/40 text-xs uppercase tracking-wider w-16 shrink-0 font-semibold">
                            {PIPELINE_LABELS[i]}
                          </span>
                          <span className="text-white text-sm font-medium truncate">
                            {agent.name}
                          </span>
                          <span className="text-white/40 text-xs ml-auto">#{agent.tokenId}</span>
                        </div>
                        {i < Math.min(chimera.agents.length, 3) - 1 && (
                          <div className="flex justify-center text-white/20 text-xs py-0.5">↓</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-5 text-center">
                  <p className="text-white/40 text-sm mb-3">No Chimera selected</p>
                  <Link
                    href="/compose"
                    className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold transition-colors"
                  >
                    Compose a Chimera →
                  </Link>
                </div>
              )}

              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-4">
                  Reward Distribution
                </p>
                <div className="flex items-center justify-center">
                  <RewardSplitChart
                    userPercent={userPercent}
                    creatorsPercent={creatorsPercent}
                    platformPercent={platformPercent}
                  />
                </div>
                <div className="mt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between text-white/60">
                    <span>Platform fee</span>
                    <span>{platformPercent}%</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Agent royalties ({chimera?.agents.length ?? 0} agents)</span>
                    <span>{creatorsPercent}%</span>
                  </div>
                  <div className="flex justify-between text-white font-semibold border-t border-white/10 pt-1.5">
                    <span>You receive</span>
                    <span>{userPercent}%</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!chimera}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
                >
                  Fund & Launch
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold mb-1">Fund your mission</h2>
                <p className="text-white/50 text-sm mb-6">
                  Set the reward and approve USDC spending.
                </p>
              </div>

              <div>
                <label className="block text-white/50 text-xs uppercase tracking-wider mb-2">
                  Reward Amount (USDC)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={usdcAmount}
                    onChange={(e) => {
                      setUsdcAmount(e.target.value);
                      setApprovalDone(false);
                    }}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-16 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 text-lg font-semibold transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm font-medium">
                    USDC
                  </span>
                </div>
              </div>

              {usdcAmount && parseFloat(usdcAmount) > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-white/60">
                    <span>Platform fee ({platformPercent}%)</span>
                    <span>
                      {((parseFloat(usdcAmount) * platformPercent) / 100).toFixed(2)} USDC
                    </span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Agent royalties ({creatorsPercent}%)</span>
                    <span>
                      {((parseFloat(usdcAmount) * creatorsPercent) / 100).toFixed(2)} USDC
                    </span>
                  </div>
                  <div className="flex justify-between text-white font-semibold border-t border-white/10 pt-2">
                    <span>Net reward to you</span>
                    <span>{((parseFloat(usdcAmount) * userPercent) / 100).toFixed(2)} USDC</span>
                  </div>
                </div>
              )}

              {/* Approval flow indicators */}
              <div className="flex items-center gap-3 text-sm">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    approvalDone || !needsApproval
                      ? 'border-green-500 bg-green-500/20'
                      : 'border-white/20'
                  }`}
                >
                  {(approvalDone || !needsApproval) && (
                    <span className="text-green-400 text-xs">✓</span>
                  )}
                </div>
                <span
                  className={
                    approvalDone || !needsApproval ? 'text-white/60' : 'text-white/30'
                  }
                >
                  USDC Approved
                </span>
                <div className="h-px flex-1 bg-white/10" />
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    createSuccess ? 'border-green-500 bg-green-500/20' : 'border-white/20'
                  }`}
                >
                  {createSuccess && <span className="text-green-400 text-xs">✓</span>}
                </div>
                <span className={createSuccess ? 'text-white/60' : 'text-white/30'}>
                  Mission Created
                </span>
              </div>

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

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  disabled={approving || launching}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
                >
                  Back
                </button>

                {needsApproval ? (
                  <button
                    onClick={handleApprove}
                    disabled={!usdcAmount || parseFloat(usdcAmount) <= 0 || approving}
                    className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {approving ? (
                      <>
                        <Spinner />
                        {approveIsPending ? 'Confirm in Wallet…' : 'Approving…'}
                      </>
                    ) : (
                      'Approve USDC'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleLaunch}
                    disabled={
                      !usdcAmount || parseFloat(usdcAmount) <= 0 || launching || !chimera
                    }
                    className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {launching ? (
                      <>
                        <Spinner />
                        {createIsPending ? 'Confirm in Wallet…' : 'Launching…'}
                      </>
                    ) : (
                      'Launch Mission'
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function NewMissionPage() {
  return (
    <AuthGate>
      <NewMissionForm />
    </AuthGate>
  );
}
