import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createWalletClient, http, defineChain, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { PinataSDK } from 'pinata';
import { query } from '../lib/db';
import { requireAuth } from '../middleware/auth';

// ABIs imported from ../abis/ as they become available
// import { someAbi } from '../abis/SomeContract';

const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] },
  },
});

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY,
});

const agents = new Hono();

// GET /:tokenId/identity
agents.get('/:tokenId/identity', async (c) => {
  const tokenId = c.req.param('tokenId');

  const agentRows = await query<{
    token_id: string;
    agent_wallet: string;
    agent_uri: string;
    price: string;
  }>(
    'SELECT token_id, agent_wallet, agent_uri, price FROM agents WHERE token_id = $1',
    [tokenId]
  );

  if (agentRows.length === 0) {
    return c.json({ error: 'Agent not found' }, 404);
  }

  const agent = agentRows[0];

  const caps = await query<{
    capability_id: string;
    label: string;
    description: string;
    domain: string;
    category: string;
  }>(
    `SELECT ac.capability_id, cd.label, cd.description, cd.domain, cd.category
     FROM agent_capabilities ac
     JOIN capability_definitions cd ON ac.capability_id = cd.id
     WHERE ac.token_id = $1 AND ac.revoked = FALSE`,
    [tokenId]
  );

  return c.json({
    tokenId: agent.token_id,
    agentWallet: agent.agent_wallet,
    agentUri: agent.agent_uri,
    price: agent.price != null ? String(agent.price) : '0',
    capabilityIds: caps.map((cap) => cap.capability_id),
    capabilityLabels: caps.map((cap) => cap.label),
    capabilityDescriptions: caps.map((cap) => cap.description),
    domain: caps[0]?.domain,
    category: caps[0]?.category,
  });
});

// POST /metadata — upload agent metadata to IPFS
const metadataSchema = z.object({
  name: z.string(),
  description: z.string(),
  agentWallet: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  capabilities: z.array(z.object({ id: z.string(), label: z.string() })),
  serviceEndpoints: z
    .object({
      a2a: z.string().optional(),
      mcp: z.string().optional(),
    })
    .optional(),
});

agents.post('/metadata', requireAuth, zValidator('json', metadataSchema), async (c) => {
  const body = c.req.valid('json');

  const result = await pinata.upload.public.json(body, {
    metadata: { name: `chimera-agent-${body.agentWallet}` },
  });

  return c.json({ uri: `ipfs://${result.cid}` }, 201);
});

// POST /feedback — internal endpoint called by worker
agents.post('/feedback', async (c) => {
  const { tokenId, missionId, success, decision } = await c.req.json<{
    tokenId: string;
    missionId: string;
    success: boolean;
    decision?: object;
  }>();

  await query(
    `INSERT INTO agent_tasks (token_id, mission_id, output_data, success)
     VALUES ($1, $2, $3, $4)`,
    [tokenId, missionId, decision ? JSON.stringify(decision) : null, success]
  );

  return c.json({ ok: true }, 200);
});

// POST /:tokenId/sign-and-send — backend signing proxy
agents.post('/:tokenId/sign-and-send', requireAuth, async (c) => {
  const { agentWallet, actionPayload } = await c.req.json<{
    agentWallet: string;
    actionPayload: { to: Hex; data: Hex; value?: string };
  }>();

  const privateKey = process.env.DEPLOYER_PRIVATE_KEY as Hex | undefined;
  if (!privateKey) {
    return c.json({ error: 'Signing key not configured' }, 500);
  }

  const account = privateKeyToAccount(privateKey);

  const walletClient = createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(),
  });

  const txHash = await walletClient.sendTransaction({
    to: actionPayload.to,
    data: actionPayload.data,
    value: actionPayload.value ? BigInt(actionPayload.value) : 0n,
  });

  return c.json({ txHash });
});

export default agents;
