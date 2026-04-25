import { Queue } from 'bullmq';
import { connection } from './redis';

const AGENT_MODE = process.env.AGENT_MODE ?? 'e2b';
export const QUEUE_NAME = AGENT_MODE === 'local' ? 'agent-tasks-local' : 'agent-tasks-e2b';

export const agentQueue = new Queue(QUEUE_NAME, { connection });
