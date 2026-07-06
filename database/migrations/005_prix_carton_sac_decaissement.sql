-- Prix carton et sac sur les produits
ALTER TABLE produits ADD COLUMN IF NOT EXISTS prix_carton NUMERIC(12,2) DEFAULT 0;
ALTER TABLE produits ADD COLUMN IF NOT EXISTS prix_sac NUMERIC(12,2) DEFAULT 0;

-- Décaissement obligatoirement lié à un grossiste
DELETE FROM decaissements WHERE grossiste_id IS NULL;
ALTER TABLE decaissements ALTER COLUMN grossiste_id SET NOT NULL;
