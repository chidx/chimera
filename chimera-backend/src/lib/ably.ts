import Ably from 'ably';

let client: Ably.Rest | null = null;

export function getAblyClient(): Ably.Rest {
  if (!client) {
    client = new Ably.Rest({ key: process.env.ABLY_API_KEY! });
  }
  return client;
}
