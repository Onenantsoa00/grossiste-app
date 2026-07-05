import pool from '../config/db.js'

export async function getBossDashboard (req, res, next) {
  try {
    const bossId = req.user.id

    const statsResult = await pool.query(
      `SELECT
        (SELECT COUNT(*)::int FROM grossistes WHERE boss_id = $1) AS nb_grossistes,
        (SELECT COUNT(*)::int FROM employes e
         JOIN grossistes g ON g.id = e.grossiste_id WHERE g.boss_id = $1) AS nb_employes,
        (SELECT COUNT(*)::int FROM produits p
         JOIN grossistes g ON g.id = p.grossiste_id WHERE g.boss_id = $1) AS nb_produits,
        (SELECT COUNT(*)::int FROM ventes v
         JOIN grossistes g ON g.id = v.grossiste_id WHERE g.boss_id = $1) AS nb_ventes,
        (SELECT COALESCE(SUM(v.total), 0)::numeric FROM ventes v
         JOIN grossistes g ON g.id = v.grossiste_id WHERE g.boss_id = $1) AS chiffre_affaires,
        (SELECT COALESCE(SUM(p.stock), 0)::int FROM produits p
         JOIN grossistes g ON g.id = p.grossiste_id WHERE g.boss_id = $1) AS stock_global`,
      [bossId]
    )

    const grossistesResult = await pool.query(
      `SELECT
        g.id, g.nom, g.logo, g.actif,
        (SELECT COALESCE(SUM(v.total), 0)::numeric FROM ventes v WHERE v.grossiste_id = g.id) AS chiffre_affaires,
        (SELECT COUNT(*)::int FROM produits p WHERE p.grossiste_id = g.id) AS nb_produits,
        (SELECT COUNT(*)::int FROM clients c WHERE c.grossiste_id = g.id) AS nb_clients,
        (SELECT COUNT(*)::int FROM employes e WHERE e.grossiste_id = g.id AND e.actif = true) AS nb_employes,
        (SELECT COUNT(*)::int FROM produits p WHERE p.grossiste_id = g.id AND p.stock <= p.stock_min) AS stock_faible
       FROM grossistes g
       WHERE g.boss_id = $1
       ORDER BY g.nom`,
      [bossId]
    )

    res.json({
      stats: statsResult.rows[0],
      grossistes: grossistesResult.rows
    })
  } catch (err) {
    next(err)
  }
}

export async function getEmployeDashboard (req, res, next) {
  try {
    const grossisteId = req.user.grossiste_id

    const grossisteResult = await pool.query(
      `SELECT id, nom, logo, telephone, email, adresse
       FROM grossistes WHERE id = $1`,
      [grossisteId]
    )

    const statsResult = await pool.query(
      `SELECT
        (SELECT COUNT(*)::int FROM produits WHERE grossiste_id = $1) AS nb_produits,
        (SELECT COUNT(*)::int FROM clients WHERE grossiste_id = $1) AS nb_clients,
        (SELECT COUNT(*)::int FROM ventes WHERE grossiste_id = $1) AS nb_ventes,
        (SELECT COALESCE(SUM(total), 0)::numeric FROM ventes WHERE grossiste_id = $1) AS chiffre_affaires,
        (SELECT COALESCE(SUM(stock), 0)::int FROM produits WHERE grossiste_id = $1) AS stock_total,
        (SELECT COUNT(*)::int FROM produits WHERE grossiste_id = $1 AND stock <= stock_min) AS stock_faible`,
      [grossisteId]
    )

    res.json({
      grossiste: grossisteResult.rows[0],
      stats: statsResult.rows[0]
    })
  } catch (err) {
    next(err)
  }
}

export async function getGrossisteDashboard (req, res, next) {
  try {
    const grossisteId = req.grossisteId

    const grossisteResult = await pool.query(
      `SELECT id, nom, logo, telephone, email, adresse, nif, stat, description, actif
       FROM grossistes WHERE id = $1`,
      [grossisteId]
    )

    const statsResult = await pool.query(
      `SELECT
        (SELECT COUNT(*)::int FROM produits WHERE grossiste_id = $1) AS nb_produits,
        (SELECT COUNT(*)::int FROM clients WHERE grossiste_id = $1) AS nb_clients,
        (SELECT COUNT(*)::int FROM fournisseurs WHERE grossiste_id = $1) AS nb_fournisseurs,
        (SELECT COUNT(*)::int FROM employes WHERE grossiste_id = $1 AND actif = true) AS nb_employes,
        (SELECT COUNT(*)::int FROM ventes WHERE grossiste_id = $1) AS nb_ventes,
        (SELECT COALESCE(SUM(total), 0)::numeric FROM ventes WHERE grossiste_id = $1) AS chiffre_affaires,
        (SELECT COALESCE(SUM(stock), 0)::int FROM produits WHERE grossiste_id = $1) AS stock_total,
        (SELECT COUNT(*)::int FROM produits WHERE grossiste_id = $1 AND stock <= stock_min) AS stock_faible`,
      [grossisteId]
    )

    res.json({
      grossiste: grossisteResult.rows[0],
      stats: statsResult.rows[0]
    })
  } catch (err) {
    next(err)
  }
}
