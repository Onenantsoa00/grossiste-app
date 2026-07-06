-- Unité de vente : 'piece' (nombre) ou 'kg' (poids)
ALTER TABLE produits ADD COLUMN IF NOT EXISTS unite_vente VARCHAR(10) DEFAULT 'piece';
UPDATE produits SET unite_vente = 'piece' WHERE unite_vente IS NULL;

-- Quantités décimales pour les produits au kilo
ALTER TABLE produits ALTER COLUMN stock TYPE NUMERIC(12,3) USING stock::numeric;
ALTER TABLE produits ALTER COLUMN stock_min TYPE NUMERIC(12,3) USING stock_min::numeric;
ALTER TABLE lignes_vente ALTER COLUMN quantite TYPE NUMERIC(12,3) USING quantite::numeric;
ALTER TABLE mouvements_stock ALTER COLUMN quantite TYPE NUMERIC(12,3) USING quantite::numeric;
