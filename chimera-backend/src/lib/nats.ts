import { connect, NatsConnection } from 'nats';

let client: NatsConnection | null = null;

export async function getNatsClient(): Promise<NatsConnection> {
  if (client && !client.isClosed()) {
    return client;
  }

  client = await connect({
    servers: process.env.NATS_URL!,
    reconnect: true,
    maxReconnectAttempts: -1,
  });

  return client;
}
