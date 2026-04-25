import { createSiweMessage } from 'viem/siwe'

export async function signIn(
  address: `0x${string}`,
  signMessageAsync: (args: { message: string }) => Promise<string>
): Promise<Response> {
  const nonceRes = await fetch('/api/auth/nonce', { method: 'POST', credentials: 'include' })
  const { nonce } = await nonceRes.json()

  const message = createSiweMessage({
    domain: window.location.host,
    address,
    statement: 'Sign in to Chimera',
    uri: window.location.origin,
    version: '1',
    chainId: 10143,
    nonce,
  })

  const signature = await signMessageAsync({ message })

  return fetch('/api/auth/verify', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, signature }),
  })
}

export async function signOut(): Promise<Response> {
  return fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' })
}
