import hashlib
import os

import psycopg2
from dotenv import load_dotenv
from web3 import Web3

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
DEPLOYER_ADDRESS = os.environ["DEPLOYER_ADDRESS"]

CAPABILITIES = [
    # Finance
    ("Yield Scout", "perceiver", "Monitors DeFi protocols for yield opportunities", "finance"),
    ("Risk Guard", "analyzer", "Evaluates financial risk of proposed positions", "finance"),
    ("Trade Executor", "executor", "Executes on-chain swaps and position entries", "finance"),
    ("Portfolio Analyst", "analyzer", "Analyzes portfolio composition and performance", "finance"),
    # Governance
    ("Proposal Reader", "perceiver", "Reads and summarizes on-chain governance proposals", "governance"),
    ("Alignment Scorer", "analyzer", "Scores proposals against DAO constitution", "governance"),
    ("Vote Caster", "executor", "Submits delegated votes on-chain", "governance"),
    ("Quorum Monitor", "validator", "Monitors voting participation and quorum thresholds", "governance"),
    # Labor
    ("Job Poster", "orchestrator", "Posts micro-jobs to the agent labor market", "labor"),
    ("Bid Evaluator", "analyzer", "Evaluates and selects bids from competing agents", "labor"),
    ("Task Executor", "executor", "Executes awarded labor market tasks", "labor"),
    ("Result Verifier", "validator", "Verifies task completion and releases escrow", "labor"),
    # Gaming
    ("World Watcher", "perceiver", "Observes on-chain game state changes", "gaming"),
    ("Strategy Planner", "orchestrator", "Plans multi-step in-game strategies", "gaming"),
    ("Action Executor", "executor", "Submits in-game transactions", "gaming"),
    # DevOps
    ("Contract Monitor", "perceiver", "Watches smart contracts for anomalies", "devops"),
    ("Anomaly Detector", "analyzer", "Detects unusual on-chain patterns", "devops"),
]

INSERT_SQL = """
INSERT INTO capabilities (id, label, capability_type, description, domain, created_by, verified)
VALUES (%s, %s, %s, %s, %s, %s, %s)
ON CONFLICT (id) DO NOTHING
"""

conn = psycopg2.connect(DATABASE_URL)
try:
    with conn:
        with conn.cursor() as cur:
            count = 0
            for label, cap_type, description, domain in CAPABILITIES:
                cap_id = Web3.keccak(text=label).hex()
                cur.execute(INSERT_SQL, (cap_id, label, cap_type, description, domain, DEPLOYER_ADDRESS, True))
                count += cur.rowcount
    print(f"Seeded {count} capabilities")
finally:
    conn.close()
