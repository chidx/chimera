'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, isAddress } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useCapabilityList, getCategoryIcon, getCategoryColor, type CapabilityDefinition } from '@/hooks/useCapabilities';
import AuthGate from '@/components/AuthGate';

const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_CHIMERA_REGISTRY as `0x${string}`;

const REGISTRY_ABI = [
  {
    name: 'mintAgent',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentWallet', type: 'address' },
      { name: 'agentURI', type: 'string' },
      { name: 'capabilityIds', type: 'bytes32[]' },
      { name: 'stakedAmount', type: 'uint128' },
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
  },
] as const;

type Step = 'uploading' | 'minting' | 'done' | null;

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

function ProgressStep({
  label,
  status,
}: {
  label: string;
  status: 'pending' | 'active' | 'done';
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
          status === 'done'
            ? 'border-green-500 bg-green-500/20'
            : status === 'active'
              ? 'border-indigo-400 bg-indigo-500/20'
              : 'border-white/20'
        }`}
      >
        {status === 'done' ? (
          <span className="text-green-400 text-xs">✓</span>
        ) : status === 'active' ? (
          <Spinner />
        ) : null}
      </div>
      <span
        className={
          status === 'done'
            ? 'text-white/50 line-through text-sm'
            : status === 'active'
              ? 'text-white text-sm font-medium'
              : 'text-white/30 text-sm'
        }
      >
        {label}
      </span>
    </div>
  );
}

function CapabilityDropdown({
  selected,
  onChange,
}: {
  selected: CapabilityDefinition[];
  onChange: (caps: CapabilityDefinition[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const { data: capabilities = [], isLoading } = useCapabilityList();

  const filtered = capabilities.filter(
    (c) =>
      c.label.toLowerCase().includes(search.toLowerCase()) ||
      (c.category ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.domain ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = useCallback(
    (cap: CapabilityDefinition) => {
      if (selected.find((s) => s.id === cap.id)) {
        onChange(selected.filter((s) => s.id !== cap.id));
      } else {
        onChange([...selected, cap]);
      }
    },
    [selected, onChange],
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left text-white focus:outline-none focus:border-indigo-500 transition-colors flex items-center justify-between"
      >
        <span className={selected.length === 0 ? 'text-white/30' : undefined}>
          {selected.length === 0
            ? 'Select capabilities…'
            : `${selected.length} selected`}
        </span>
        <span className="text-white/40 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((cap) => (
            <span
              key={cap.id}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getCategoryColor(cap.category)} text-white`}
            >
              {getCategoryIcon(cap.category)} {cap.label}
              <button
                type="button"
                onClick={() => toggle(cap)}
                className="hover:text-white/60 transition-colors ml-0.5"
                aria-label={`Remove ${cap.label}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 mt-1 w-full bg-gray-900 border border-white/10 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="p-2 border-b border-white/10">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search capabilities…"
                className="w-full bg-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none"
              />
            </div>
            <div className="max-h-56 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <Spinner />
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-6">No capabilities found</p>
              ) : (
                filtered.map((cap) => {
                  const isSelected = !!selected.find((s) => s.id === cap.id);
                  return (
                    <button
                      key={cap.id}
                      type="button"
                      onClick={() => toggle(cap)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isSelected ? 'bg-indigo-600/20' : 'hover:bg-white/5'
                      }`}
                    >
                      <span className="text-lg shrink-0">{getCategoryIcon(cap.category)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{cap.label}</p>
                        {cap.category && (
                          <p className="text-white/40 text-xs capitalize">{cap.category}</p>
                        )}
                      </div>
                      {isSelected && <span className="text-indigo-400 text-xs shrink-0">✓</span>}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BuilderForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [agentWallet, setAgentWallet] = useState('');
  const [selectedCaps, setSelectedCaps] = useState<CapabilityDefinition[]>([]);
  const [stakeAmount, setStakeAmount] = useState('');

  const [step, setStep] = useState<Step>(null);
  const [ipfsUri, setIpfsUri] = useState('');
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null);

  const walletValid = isAddress(agentWallet);
  const stakeAmountParsed = stakeAmount && parseFloat(stakeAmount) > 0
    ? parseUnits(stakeAmount, 6)
    : BigInt(0);
  const {
    writeContract: mintWrite,
    data: mintTxHash,
    isPending: mintIsPending,
    error: mintWriteError,
  } = useWriteContract();

  const { isLoading: mintConfirming, isSuccess: mintSuccess, data: mintReceipt } =
    useWaitForTransactionReceipt({ hash: mintTxHash });

  useEffect(() => {
    if (mintSuccess && mintReceipt) {
      const tokenIdHex = mintReceipt.logs[0]?.topics[3];
      const tokenId = tokenIdHex ? BigInt(tokenIdHex).toString() : 'unknown';
      setMintedTokenId(tokenId);
      setStep('done');
    }
  }, [mintSuccess, mintReceipt]);

  const executeMint = useCallback(
    (uri: string) => {
      const capIds = selectedCaps.map((c) => c.id as `0x${string}`);
      mintWrite({
        address: REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        functionName: 'mintAgent',
        args: [
          agentWallet as `0x${string}`,
          uri,
          capIds,
          BigInt(stakeAmountParsed),
        ],
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedCaps, agentWallet, stakeAmountParsed],
  );

  const txError = mintWriteError;

  const isSubmitting = step === 'uploading' || step === 'minting';

  const canSubmit =
    name.trim().length > 0 &&
    description.trim().length > 0 &&
    walletValid &&
    !isSubmitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setMintError(null);
    setStep('uploading');

    let uri: string;
    try {
      const res = await fetch('/api/agents/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          agentWallet,
          capabilities: selectedCaps.map((c) => ({ id: c.id, label: c.label })),
        }),
      });
      if (!res.ok) throw new Error(`Metadata upload failed: ${res.statusText}`);
      const data = await res.json();
      uri = data.uri ?? data.ipfsUri ?? data.metadataUri;
      if (!uri) throw new Error('No IPFS URI returned from server');
      setIpfsUri(uri);
    } catch (err) {
      setMintError(err instanceof Error ? err.message : 'Metadata upload failed');
      setStep(null);
      return;
    }

    setStep('minting');
    executeMint(uri);
  }

  if (step === 'done' && mintedTokenId) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="text-7xl mb-6">🤖</div>
          <h1 className="text-3xl font-bold mb-2">Agent Minted!</h1>
          <p className="text-white/60 mb-1">
            Token ID:{' '}
            <span className="text-white font-mono font-bold">#{mintedTokenId}</span>
          </p>
          <p className="text-white/40 text-sm mb-8">{name} is now registered on-chain.</p>
          <div className="flex gap-3 justify-center">
            <Link
              href={`/marketplace?tokenId=${mintedTokenId}`}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
            >
              View Listing →
            </Link>
            <Link
              href="/builder"
              onClick={() => {
                setStep(null);
                setName('');
                setDescription('');
                setAgentWallet('');
                setSelectedCaps([]);
                setStakeAmount('');
                setMintedTokenId(null);
              }}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
            >
              Mint Another
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
            href="/"
            className="shrink-0 text-white/60 hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            <span aria-hidden>←</span>
            <span>Back</span>
          </Link>
          <h1 className="font-bold text-xl min-w-0">Mint Agent</h1>
          <div className="w-16 shrink-0" aria-hidden />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          {/* Agent Name */}
          <div>
            <label className="block text-white/50 text-xs uppercase tracking-wider mb-2">
              Agent Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DataSentinel-7"
              maxLength={80}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-white/50 text-xs uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this agent does, its strengths, and intended use cases…"
              rows={4}
              maxLength={2000}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 resize-none transition-colors"
            />
            <p className="text-white/30 text-xs mt-1 text-right">{description.length}/2000</p>
          </div>

          {/* Agent Wallet */}
          <div>
            <label className="block text-white/50 text-xs uppercase tracking-wider mb-2">
              Agent Wallet Address
            </label>
            <input
              type="text"
              value={agentWallet}
              onChange={(e) => setAgentWallet(e.target.value)}
              placeholder="0x…"
              spellCheck={false}
              className={`w-full bg-white/5 border rounded-xl px-4 py-3 font-mono text-sm text-white placeholder-white/30 focus:outline-none transition-colors ${
                agentWallet && !walletValid
                  ? 'border-red-500/60 focus:border-red-500'
                  : 'border-white/10 focus:border-indigo-500'
              }`}
            />
            {agentWallet && !walletValid && (
              <p className="text-red-400 text-xs mt-1">Must be a valid Ethereum address (0x…)</p>
            )}
          </div>

          {/* Capabilities */}
          <div>
            <label className="block text-white/50 text-xs uppercase tracking-wider mb-2">
              Capabilities
            </label>
            <CapabilityDropdown selected={selectedCaps} onChange={setSelectedCaps} />
          </div>

          {/* Stake Amount */}
          <div>
            <label className="block text-white/50 text-xs uppercase tracking-wider mb-2">
              Stake Amount{' '}
              <span className="normal-case text-white/30">(optional)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-16 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 text-lg font-semibold transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm font-medium">
                USDC
              </span>
            </div>
            <p className="text-white/30 text-xs mt-1">
              This amount is stored on-chain for trust and visibility. The registry does not move USDC on mint, so
              no token approval is required.
            </p>
          </div>

          {/* Progress steps */}
          <AnimatePresence>
            {step !== null && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3 overflow-hidden"
              >
                <p className="text-white/50 text-xs uppercase tracking-wider mb-4">Progress</p>
                <ProgressStep
                  label="Uploading metadata…"
                  status={step === 'uploading' ? 'active' : 'done'}
                />
                <ProgressStep
                  label="Minting agent…"
                  status={step === 'minting' ? 'active' : step === 'done' ? 'done' : 'pending'}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Errors */}
          <AnimatePresence>
            {(mintError || txError) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3"
              >
                <p className="text-red-400 text-sm break-words">
                  {mintError ?? txError?.message}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || (agentWallet.length > 0 && !walletValid)}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Spinner />
                {step === 'uploading'
                  ? 'Uploading metadata…'
                  : mintIsPending
                    ? 'Confirm in Wallet…'
                    : 'Minting agent…'}
              </>
            ) : (
              'Mint Agent'
            )}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function BuilderPage() {
  return (
    <AuthGate>
      <BuilderForm />
    </AuthGate>
  );
}
