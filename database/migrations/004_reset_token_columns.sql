-- Colonnes reset sur employes (aligné avec bosses)
ALTER TABLE employes ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE employes ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

-- Compatibilité : si password_resets n'existe pas, rien à faire
-- Les bosses utilisent reset_token / reset_token_expiry directement sur la table
