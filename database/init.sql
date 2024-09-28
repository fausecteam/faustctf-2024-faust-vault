CREATE TABLE kv_store (
    "group" TEXT,
    key TEXT,
    value TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY ("group", key)
);
CREATE INDEX idx_created_at ON kv_store USING BTREE (created_at);