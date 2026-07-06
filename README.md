# Gestion Grossiste — Plateforme SaaS

Plateforme web de gestion de grossistes pour entrepreneurs possédant un ou plusieurs magasins/dépôts.

## Stack

| Couche | Technologies |
|--------|-------------|
| Frontend | Quasar, Vue 3, Pinia, Vue Router, Axios |
| Backend | Node.js, Express, JWT, bcrypt, PostgreSQL |
| Base de données | PostgreSQL (schéma fourni) |

## Structure du projet

```
grossiste/
├── backend/          # API REST Express
├── frontend/         # Application Quasar
└── database/         # Scripts SQL
```

## Prérequis

- Node.js 20+
- PostgreSQL avec la base `gestion_grossiste`

## Installation

### 1. Base de données

Si votre base existe déjà, exécutez la migration pour les tables/colonnes additionnelles :

```bash
psql -U postgres -d gestion_grossiste -f database/migrations/001_add_actif_and_parametres.sql
psql -U postgres -d gestion_grossiste -f database/migrations/002_add_unite_vente.sql
psql -U postgres -d gestion_grossiste -f database/migrations/003_add_features.sql
psql -U postgres -d gestion_grossiste -f database/migrations/004_reset_token_columns.sql
psql -U postgres -d gestion_grossiste -f database/migrations/005_prix_carton_sac_decaissement.sql
psql -U postgres -d gestion_grossiste -f database/migrations/006_conversion_stock_cout.sql
```

Pour une nouvelle installation complète :

```bash
psql -U postgres -f database/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Éditez .env avec vos identifiants PostgreSQL
npm install
npm run dev
```

L'API démarre sur `http://localhost:3000`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

L'application démarre sur `http://localhost:9000`.

## Rôles utilisateurs

### Boss
- Crée et gère ses grossistes et employés
- Consulte les statistiques globales
- Peut « entrer » dans un grossiste sans se reconnecter

### Employé
- Accès limité à **un seul** grossiste
- Gère produits, stock, ventes, clients, fournisseurs

## Isolation des données

Chaque Boss possède ses données de façon totalement indépendante. Les employés n'accèdent qu'au grossiste auquel ils sont affectés. Le header `X-Grossiste-Id` permet au Boss d'opérer dans le contexte d'un grossiste.

## API principale

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription Boss |
| POST | `/api/auth/login` | Connexion Boss/Employé |
| GET | `/api/dashboard/boss` | Stats globales Boss |
| GET | `/api/grossistes` | Liste des grossistes |
| GET | `/api/employes` | Liste des employés |
| GET | `/api/produits` | Produits du grossiste actif (filtres: `q`, `categorie_id`) |
| GET | `/api/categories` | Catégories du grossiste |
| GET | `/api/decaissements` | Décaissements Boss |
| POST | `/api/ventes` | Créer une vente (panier) |
| POST | `/api/auth/forgot-password` | Mot de passe oublié |
| POST | `/api/auth/reset-password` | Réinitialiser le mot de passe |

## Prochaines étapes

- Import/Export Excel des produits
- Génération PDF des factures (PDFKit)
- Upload images (Multer)
- QR Code / Code-barres
- Rapports (journalier, hebdo, mensuel)
- Paramètres entreprise et abonnement SaaS
