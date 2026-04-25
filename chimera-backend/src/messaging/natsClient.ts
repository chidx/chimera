import { connect, NatsConnection, StringCodec } from 'nats';
import { verifyMessage } from 'viem';

export interface AgentMessage {
  messageId: string;
  missionId: string;
  fromAgent: { tokenId: number; wallet: string };
  toAgent: { tokenId: number };
  messageType: string;
  payload: Record<string, unknown>;
  timestamp: number;
  signature: string;
}

let _nc: NatsConnection | null = null;

export async function createNatsClient(): Promise<NatsConnection> {
  if (_nc) return _nc;
  _nc = await connect({ servers: process.env.NATS_URL });
  return _nc;
}

const sc = StringCodec();

export function publishMessage(
  nc: NatsConnection,
  missionId: string,
  fromTokenId: number,
  toTokenId: number,
  msg: AgentMessage,
): void {
  const subject = `chimera.mission.${missionId}.${fromTokenId}.${toTokenId}`;
  nc.publish(subject, sc.encode(JSON.stringify(msg)));
}

export async function subscribeToMessages(
  nc: NatsConnection,
  missionId: string,
  myTokenId: number,
  handler: (msg: AgentMessage) => void,
): Promise<void> {
  const subject = `chimera.mission.${missionId}.*.${myTokenId}`;
  const sub = nc.subscribe(subject);

  for await (const m of sub) {
    let msg: AgentMessage;
    try {
      msg = JSON.parse(sc.decode(m.data)) as AgentMessage;
    } catch {
      continue;
    }

    const sigPayload = JSON.stringify({
      messageId: msg.messageId,
      missionId: msg.missionId,
      fromTokenId: msg.fromAgent.tokenId,
      payload: msg.payload,
      timestamp: msg.timestamp,
    });

    try {
      const valid = await verifyMessage({
        address: msg.fromAgent.wallet as `0x${string}`,
        message: sigPayload,
        signature: msg.signature as `0x${string}`,
      });
      if (valid) handler(msg);
    } catch {
      // invalid signature — skip
    }
  }
}
