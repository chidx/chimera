import { onchainTable } from "@ponder/core";

export const agent = onchainTable("agent", (p) => ({
  id: p.bigint().primaryKey(),
  creator: p.hex().notNull(),
  agentWallet: p.hex().notNull(),
  createdAt: p.bigint().notNull(),
  reputation: p.integer().notNull().$default(() => 0),
  tasksDone: p.integer().notNull().$default(() => 0),
}));

export const agentCapability = onchainTable("agentCapability", (p) => ({
  id: p.text().primaryKey(),
  tokenId: p.bigint().notNull(),
  capabilityId: p.hex().notNull(),
  revoked: p.boolean().notNull().$default(() => false),
  grantedAt: p.bigint().notNull(),
}));

export const reputationFeedback = onchainTable("reputationFeedback", (p) => ({
  id: p.text().primaryKey(),
  agentTokenId: p.bigint().notNull(),
  submitter: p.hex().notNull(),
  score: p.integer().notNull(),
  taskRef: p.hex().notNull(),
  evidenceURI: p.text().notNull(),
  timestamp: p.bigint().notNull(),
}));

export const mission = onchainTable("mission", (p) => ({
  id: p.bigint().primaryKey(),
  status: p.text().notNull().$default(() => "pending"),
  earned: p.bigint(),
}));

export const messageLog = onchainTable("messageLog", (p) => ({
  id: p.bigint().primaryKey(),
  missionId: p.integer().notNull(),
  fromTokenId: p.integer().notNull(),
  toTokenId: p.integer().notNull(),
  messageType: p.text().notNull(),
  payloadHash: p.hex().notNull(),
  timestamp: p.integer().notNull(),
}));
