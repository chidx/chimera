import 'dotenv/config';
import { agentQueue } from '../lib/agentQueue';

async function main() {
  await agentQueue.add('agent-task', {
    tokenId: 1,
    missionId: '1',
    missionParams: {},
    nextAgentTokenId: 2,
  });
  console.log('Job enqueued');
  process.exit(0);
}

main();
