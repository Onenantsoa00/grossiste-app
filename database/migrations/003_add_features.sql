-- Date de péremption optionnelle sur les produits
ALTER TABLE produits ADD COLUMN IF NOT EXISTS date_peremption DATE;

-- Type de prix appliqué sur chaque ligne de vente (unitaire ou grossiste)
ALTER TABLE lignes_vente ADD COLUMN IF NOT EXISTS type_prix VARCHAR(20) DEFAULT 'unitaire';

-- Référence reçu unique pour identifier une vente
ALTER TABLE ventes ADD COLUMN IF NOT EXISTS recu VARCHAR(50) UNIQUE;

UPDATE ventes SET recu = numero WHERE recu IS NULL;

-- Décaissements du Boss (montant partiel possible)
CREATE TABLE IF NOT EXISTS decaissements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boss_id UUID NOT NULL,
    grossiste_id UUID,
    montant NUMERIC(12,2) NOT NULL CHECK (montant > 0),
    motif TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_decaissement_boss
        FOREIGN KEY (boss_id)
        REFERENCES bosses(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_decaissement_grossiste
        FOREIGN KEY (grossiste_id)
        REFERENCES grossistes(id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_decaissements_boss ON decaissements(boss_id);
CREATE INDEX IF NOT EXISTS idx_produits_categorie ON produits(categorie_id);
