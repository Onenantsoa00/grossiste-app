-- À exécuter si votre base existe déjà sans ces colonnes/tables

ALTER TABLE grossistes ADD COLUMN IF NOT EXISTS actif BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS parametres_entreprise (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boss_id UUID NOT NULL UNIQUE,
    nom_entreprise VARCHAR(200),
    logo TEXT,
    devise VARCHAR(10) DEFAULT 'Ar',
    taux_tva NUMERIC(5,2) DEFAULT 0,
    prefixe_facture VARCHAR(20) DEFAULT 'FAC',
    prochain_numero INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_param_boss
        FOREIGN KEY (boss_id)
        REFERENCES bosses(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(150) NOT NULL,
    token TEXT NOT NULL,
    user_type VARCHAR(20) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
