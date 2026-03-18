CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    funding_target BIGINT NOT NULL,
    escrow_treasury_address TEXT NOT NULL,
    milestones JSONB NOT NULL
);
