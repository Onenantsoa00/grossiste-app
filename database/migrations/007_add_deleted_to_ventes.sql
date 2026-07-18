ALTER TABLE ventes
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ventes_grossiste_deleted ON ventes (grossiste_id, deleted);