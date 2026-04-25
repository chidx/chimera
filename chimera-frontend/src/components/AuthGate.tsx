'use client'

import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useQuery } from '@tanstack/react-query'
import { useAccount, useSignMessage } from 'wagmi'
import { signIn } from '@/lib/siwe'

async function fetchSession(): Promise<{ authenticated: boolean }> {
  const res = await fetch('/api/auth/session', { credentials: 'include' })
  if (!res.ok) return { authenticated: false }
  return res.json()
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [error, setError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['auth-session'],
    queryFn: fetchSession,
    retry: false,
  })

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ConnectButton />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (!data?.authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <ConnectButton />
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={signingIn || !signMessageAsync}
          onClick={async () => {
            if (!address) return
            setError(null)
            setSigningIn(true)
            try {
              const res = await signIn(address, signMessageAsync)
              if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                setError(body.error ?? `Sign in failed (${res.status})`)
              } else {
                await refetch()
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Sign in failed')
            } finally {
              setSigningIn(false)
            }
          }}
        >
          {signingIn ? 'Signing in...' : 'Sign In'}
        </button>
        {error && (
          <p className="text-sm text-red-500 max-w-xs text-center">{error}</p>
        )}
      </div>
    )
  }

  return <>{children}</>
}
