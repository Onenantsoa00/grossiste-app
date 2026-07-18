import pool from "../config/db.js";

export async function findLatestByBossId(bossId) {
  const { rows } = await pool.query(
    `SELECT id, boss_id, plan, date_debut, date_expiration, statut, jours_grace, created_at, updated_at
     FROM subscriptions
     WHERE boss_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [bossId],
  );
  return rows[0];
}

export async function createSubscription({
  bossId,
  plan,
  dateDebut,
  dateExpiration,
  statut,
  joursGrave,
}) {
  const { rows } = await pool.query(
    `INSERT INTO subscriptions (boss_id, plan, date_debut, date_expiration, statut, jours_grace)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [bossId, plan, dateDebut, dateExpiration, statut, joursGrave],
  );
  return rows[0];
}

export async function updateSubscriptionExpiration(
  subscriptionId,
  dateExpiration,
  statut,
) {
  const { rows } = await pool.query(
    `UPDATE subscriptions
     SET date_expiration = $1,
         statut = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [dateExpiration, statut, subscriptionId],
  );
  return rows[0];
}

export async function createPayment({
  subscriptionId,
  montant,
  modePaiement,
  reference,
  commentaire,
  validePar,
  datePaiement,
}) {
  const { rows } = await pool.query(
    `INSERT INTO subscription_payments
     (subscription_id, montant, mode_paiement, reference, commentaire, valide_par, date_paiement)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      subscriptionId,
      montant,
      modePaiement,
      reference,
      commentaire || null,
      validePar || null,
      datePaiement,
    ],
  );
  return rows[0];
}
