import { useQuery } from '@tanstack/react-query';

export interface CapabilityDefinition {
  id: string;
  label: string;
  description: string;
  domain: string | null;
  category: string | null;
  verified: boolean;
}

export function useCapabilityResolution(capabilityIds: string[]) {
  return useQuery<CapabilityDefinition[]>({
    queryKey: ['capabilities', capabilityIds],
    queryFn: async () => {
      const res = await fetch('/api/capabilities/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: capabilityIds }),
      });
      if (!res.ok) throw new Error('Failed to resolve capabilities');
      return res.json();
    },
    enabled: capabilityIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCapabilityList(filters?: { domain?: string; category?: string }) {
  return useQuery<CapabilityDefinition[]>({
    queryKey: ['capabilities', 'list', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.domain) params.set('domain', filters.domain);
      if (filters?.category) params.set('category', filters.category);
      const query = params.toString();
      const res = await fetch(`/api/capabilities${query ? `?${query}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch capabilities');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

const CATEGORY_COLORS: Record<string, string> = {
  perceiver: 'from-blue-900 to-blue-700',
  analyzer: 'from-purple-900 to-purple-700',
  executor: 'from-yellow-900 to-yellow-700',
  orchestrator: 'from-green-900 to-green-700',
  validator: 'from-red-900 to-red-700',
  communicator: 'from-pink-900 to-pink-700',
};

const CATEGORY_ICONS: Record<string, string> = {
  perceiver: '🔭',
  analyzer: '📊',
  executor: '⚡',
  orchestrator: '🎯',
  validator: '🛡️',
  communicator: '📡',
};

export function getCategoryColor(category: string | null): string {
  return (category && CATEGORY_COLORS[category]) ?? 'from-gray-900 to-gray-700';
}

export function getCategoryIcon(category: string | null): string {
  return (category && CATEGORY_ICONS[category]) ?? '🤖';
}
