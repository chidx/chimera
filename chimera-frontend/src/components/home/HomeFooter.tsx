'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const links = [
  { label: 'Docs', href: '#' },
  { label: 'GitHub', href: '#' },
  { label: 'Discord', href: '#' },
];

export function HomeFooter() {
  const { isConnected } = useAccount();

  return (
    <footer className="border-t border-white/10">
      {!isConnected && (
        <div className="bg-gray-950 border-b border-white/10 px-4 py-6 text-center">
          <p className="text-white/60 mb-4 text-sm">
            Connect your wallet to launch agents, create missions, and earn
            rewards.
          </p>
          <ConnectButton />
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-white/30 text-sm">
          Chimera &mdash; AI Agent Marketplace on Monad
        </p>
        <div className="flex items-center gap-6">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
