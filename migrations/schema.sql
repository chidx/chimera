CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS capability_definitions (
  id           CHAR(66)     PRIMARY KEY,
  label        VARCHAR(100) NOT NULL,
  description  TEXT,
  domain       VARCHAR(50),
  category     VARCHAR(50),
  created_by   CHAR(42)     NOT NULL,
  created_at   TIMESTAMP    DEFAULT NOW(),
  verified     BOOLEAN      DEFAULT FALSE
);

-- agent_wallet is NOT unique: the registry can store the same address on multiple token IDs.
CREATE TABLE IF NOT EXISTS agents (
  token_id       INTEGER      PRIMARY KEY,
  creator        CHAR(42)     NOT NULL,
  agent_wallet   CHAR(42)     NOT NULL,
  name           VARCHAR(100) NOT NULL DEFAULT '',
  agent_uri      TEXT         NOT NULL DEFAULT '',
  staked_amount  NUMERIC(30)  NOT NULL DEFAULT 0,
  reputation     INTEGER      NOT NULL DEFAULT 0,
  tasks_done     INTEGER      NOT NULL DEFAULT 0,
  win_rate       INTEGER      NOT NULL DEFAULT 0,
  price          NUMERIC(18,6) NOT NULL DEFAULT 0,
  franchise_open BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMP    NOT NULL,
  is_active      BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS agent_capabilities (
  token_id      INTEGER   NOT NULL REFERENCES agents(token_id),
  capability_id CHAR(66)  NOT NULL REFERENCES capability_definitions(id),
  granted_at    TIMESTAMP DEFAULT NOW(),
  revoked       BOOLEAN   DEFAULT FALSE,
  PRIMARY KEY (token_id, capability_id)
);

CREATE TABLE IF NOT EXISTS missions (
  id               TEXT         PRIMARY KEY,
  budget           NUMERIC(30)  NOT NULL DEFAULT 0,
  agent_token_ids  INTEGER[]    NOT NULL DEFAULT '{}',
  agent_creators   CHAR(42)[]   NOT NULL DEFAULT '{}',
  royalty_bps      INTEGER[]    NOT NULL DEFAULT '{}',
  mission_params   JSONB        NOT NULL DEFAULT '{}',
  status           VARCHAR(20)  NOT NULL DEFAULT 'active',
  tx_hash          CHAR(66),
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_logs (
  id            SERIAL    PRIMARY KEY,
  mission_id    TEXT      NOT NULL REFERENCES missions(id),
  from_token_id INTEGER   NOT NULL,
  to_token_id   INTEGER   NOT NULL,
  payload       JSONB     NOT NULL DEFAULT '{}',
  timestamp     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_tasks (
  id          SERIAL    PRIMARY KEY,
  token_id    INTEGER   NOT NULL REFERENCES agents(token_id),
  mission_id  INTEGER   NOT NULL,
  input_data  JSONB,
  output_data JSONB,
  success     BOOLEAN,
  executed_at TIMESTAMP DEFAULT NOW(),
  tx_hash     CHAR(66)
);

CREATE TABLE IF NOT EXISTS reputation_feedback (
  id           SERIAL    PRIMARY KEY,
  token_id     INTEGER   NOT NULL REFERENCES agents(token_id),
  submitter    CHAR(42)  NOT NULL,
  score        SMALLINT  NOT NULL CHECK (score BETWEEN 0 AND 100),
  task_ref     CHAR(66)  NOT NULL,
  evidence_uri TEXT,
  submitted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_memory (
  id         SERIAL    PRIMARY KEY,
  token_id   INTEGER   NOT NULL REFERENCES agents(token_id),
  content    TEXT      NOT NULL,
  embedding  vector(1536),
  created_at TIMESTAMP DEFAULT NOW()
);
