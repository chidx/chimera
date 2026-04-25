-- Agents created with default price 0 have no meaningful list price for the marketplace UI.
-- Backfill to a small non-zero USDC list price (run after schema + optional seed).
UPDATE agents
SET price = 1.0
WHERE price = 0;
