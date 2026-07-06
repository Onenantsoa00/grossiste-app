-- Règle de trois : contenu d'un carton (pièces) ou d'un sac (kg)
ALTER TABLE produits ADD COLUMN IF NOT EXISTS qte_par_carton NUMERIC(12,3) DEFAULT 0;
ALTER TABLE produits ADD COLUMN IF NOT EXISTS qte_par_sac NUMERIC(12,3) DEFAULT 0;

-- Coût d'achat pour les entrées de stock
ALTER TABLE mouvements_stock ADD COLUMN IF NOT EXISTS cout_achat NUMERIC(12,2) DEFAULT 0;
