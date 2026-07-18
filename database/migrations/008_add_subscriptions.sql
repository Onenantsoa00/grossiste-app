-- Ajout des tables de gestion des abonnements et des paiements manuels

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boss_id UUID NOT NULL,
    plan VARCHAR(100) NOT NULL DEFAULT 'standard',
    date_debut TIMESTAMP NOT NULL,
    date_expiration TIMESTAMP NOT NULL,
    statut VARCHAR(20) NOT NULL DEFAULT 'active',
    jours_grace INTEGER NOT NULL DEFAULT 2,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_subscription_boss
        FOREIGN KEY (boss_id)
        REFERENCES bosses(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_subscription_status
        CHECK (statut IN ('active', 'expired', 'suspended'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_boss_id ON subscriptions (boss_id);

CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL,
    montant NUMERIC(12,2) NOT NULL,
    mode_paiement VARCHAR(100) NOT NULL,
    reference TEXT NOT NULL,
    commentaire TEXT,
    valide_par UUID,
    date_paiement TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_subscription_payment_subscription
        FOREIGN KEY (subscription_id)
        REFERENCES subscriptions(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_subscription_payment_valide_par
        FOREIGN KEY (valide_par)
        REFERENCES bosses(id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id ON subscription_payments (subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_date_paiement ON subscription_payments (date_paiement);
