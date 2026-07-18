CREATE DATABASE gestion_grossiste;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- BOSSES
-- ============================================

CREATE TABLE bosses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telephone VARCHAR(30),
    password TEXT NOT NULL,
    reset_token TEXT,
    reset_token_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- GROSSISTES
-- ============================================

CREATE TABLE grossistes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boss_id UUID NOT NULL,
    nom VARCHAR(150) NOT NULL,
    logo TEXT,
    telephone VARCHAR(30),
    email VARCHAR(150),
    adresse TEXT,
    nif VARCHAR(50),
    stat VARCHAR(50),
    description TEXT,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_grossiste_boss
        FOREIGN KEY (boss_id)
        REFERENCES bosses(id)
        ON DELETE CASCADE
);

-- ============================================
-- EMPLOYES
-- ============================================

CREATE TABLE employes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grossiste_id UUID NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100),
    telephone VARCHAR(30),
    email VARCHAR(150) UNIQUE,
    password TEXT NOT NULL,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_employe_grossiste
        FOREIGN KEY (grossiste_id)
        REFERENCES grossistes(id)
        ON DELETE CASCADE
);

-- ============================================
-- CATEGORIES
-- ============================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grossiste_id UUID NOT NULL,
    nom VARCHAR(150) NOT NULL,
    description TEXT,

    CONSTRAINT fk_categorie_grossiste
        FOREIGN KEY (grossiste_id)
        REFERENCES grossistes(id)
        ON DELETE CASCADE
);

-- ============================================
-- MARQUES
-- ============================================

CREATE TABLE marques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grossiste_id UUID NOT NULL,
    nom VARCHAR(150) NOT NULL,

    CONSTRAINT fk_marque_grossiste
        FOREIGN KEY (grossiste_id)
        REFERENCES grossistes(id)
        ON DELETE CASCADE
);

-- ============================================
-- FOURNISSEURS
-- ============================================

CREATE TABLE fournisseurs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grossiste_id UUID NOT NULL,
    nom VARCHAR(150) NOT NULL,
    telephone VARCHAR(30),
    adresse TEXT,
    email VARCHAR(150),
    nif VARCHAR(50),
    stat VARCHAR(50),

    CONSTRAINT fk_fournisseur_grossiste
        FOREIGN KEY (grossiste_id)
        REFERENCES grossistes(id)
        ON DELETE CASCADE
);

-- ============================================
-- CLIENTS
-- ============================================

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grossiste_id UUID NOT NULL,
    nom VARCHAR(150) NOT NULL,
    telephone VARCHAR(30),
    adresse TEXT,
    email VARCHAR(150),

    CONSTRAINT fk_client_grossiste
        FOREIGN KEY (grossiste_id)
        REFERENCES grossistes(id)
        ON DELETE CASCADE
);

-- ============================================
-- PRODUITS
-- ============================================

CREATE TABLE produits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grossiste_id UUID NOT NULL,
    categorie_id UUID,
    marque_id UUID,
    fournisseur_id UUID,

    reference VARCHAR(100),
    code_barre VARCHAR(100),

    nom VARCHAR(200) NOT NULL,
    description TEXT,

    prix_achat NUMERIC(12,2) DEFAULT 0,
    prix_vente NUMERIC(12,2) DEFAULT 0,
    prix_grossiste NUMERIC(12,2) DEFAULT 0,
    prix_carton NUMERIC(12,2) DEFAULT 0,
    prix_sac NUMERIC(12,2) DEFAULT 0,
    qte_par_carton NUMERIC(12,3) DEFAULT 0,
    qte_par_sac NUMERIC(12,3) DEFAULT 0,

    unite_vente VARCHAR(10) DEFAULT 'piece',

    stock NUMERIC(12,3) DEFAULT 0,
    stock_min NUMERIC(12,3) DEFAULT 0,

    image TEXT,
    date_peremption DATE,

    CONSTRAINT fk_produit_grossiste
        FOREIGN KEY (grossiste_id)
        REFERENCES grossistes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_produit_categorie
        FOREIGN KEY (categorie_id)
        REFERENCES categories(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_produit_marque
        FOREIGN KEY (marque_id)
        REFERENCES marques(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_produit_fournisseur
        FOREIGN KEY (fournisseur_id)
        REFERENCES fournisseurs(id)
        ON DELETE SET NULL
);

-- ============================================
-- MOUVEMENTS STOCK
-- ============================================

CREATE TABLE mouvements_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grossiste_id UUID NOT NULL,
    produit_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL,
    quantite NUMERIC(12,3) NOT NULL,
    motif TEXT,
    cout_achat NUMERIC(12,2) DEFAULT 0,
    utilisateur_id UUID,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mv_grossiste
        FOREIGN KEY (grossiste_id)
        REFERENCES grossistes(id),

    CONSTRAINT fk_mv_produit
        FOREIGN KEY (produit_id)
        REFERENCES produits(id),

    CONSTRAINT fk_mv_utilisateur
        FOREIGN KEY (utilisateur_id)
        REFERENCES employes(id)
);

-- ============================================
-- VENTES
-- ============================================

CREATE TABLE ventes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    grossiste_id UUID NOT NULL,
    client_id UUID,
    utilisateur_id UUID,

    numero VARCHAR(50) UNIQUE NOT NULL,
    recu VARCHAR(50) UNIQUE,

    montant NUMERIC(12,2) DEFAULT 0,
    remise NUMERIC(12,2) DEFAULT 0,
    tva NUMERIC(12,2) DEFAULT 0,
    total NUMERIC(12,2) DEFAULT 0,

    paye NUMERIC(12,2) DEFAULT 0,
    reste NUMERIC(12,2) DEFAULT 0,

    deleted BOOLEAN DEFAULT FALSE NOT NULL,

    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_vente_grossiste
        FOREIGN KEY (grossiste_id)
        REFERENCES grossistes(id),

    CONSTRAINT fk_vente_client
        FOREIGN KEY (client_id)
        REFERENCES clients(id),

    CONSTRAINT fk_vente_employe
        FOREIGN KEY (utilisateur_id)
        REFERENCES employes(id)
);

-- ============================================
-- LIGNES VENTE
-- ============================================

CREATE TABLE lignes_vente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vente_id UUID NOT NULL,
    produit_id UUID NOT NULL,

    prix NUMERIC(12,2) NOT NULL,
    quantite NUMERIC(12,3) NOT NULL,
    total NUMERIC(12,2) NOT NULL,
    type_prix VARCHAR(20) DEFAULT 'unitaire',

    CONSTRAINT fk_lv_vente
        FOREIGN KEY (vente_id)
        REFERENCES ventes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_lv_produit
        FOREIGN KEY (produit_id)
        REFERENCES produits(id)
);

-- ============================================
-- PAIEMENTS
-- ============================================

CREATE TABLE paiements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vente_id UUID NOT NULL,

    mode VARCHAR(50),
    montant NUMERIC(12,2) NOT NULL,
    reference VARCHAR(150),

    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_paiement_vente
        FOREIGN KEY (vente_id)
        REFERENCES ventes(id)
        ON DELETE CASCADE
);

-- ============================================
-- FACTURES
-- ============================================

CREATE TABLE factures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vente_id UUID NOT NULL,

    numero VARCHAR(100) UNIQUE NOT NULL,
    pdf TEXT,

    CONSTRAINT fk_facture_vente
        FOREIGN KEY (vente_id)
        REFERENCES ventes(id)
        ON DELETE CASCADE
);

-- ============================================
-- PARAMETRES ENTREPRISE (Boss)
-- ============================================

CREATE TABLE parametres_entreprise (
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

-- ============================================
-- RESET MOT DE PASSE
-- ============================================

-- ============================================
-- DECAISSEMENTS BOSS
-- ============================================

CREATE TABLE decaissements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boss_id UUID NOT NULL,
    grossiste_id UUID NOT NULL,
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

-- ============================================
-- RESET MOT DE PASSE
-- ============================================

CREATE TABLE password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(150) NOT NULL,
    token TEXT NOT NULL,
    user_type VARCHAR(20) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
