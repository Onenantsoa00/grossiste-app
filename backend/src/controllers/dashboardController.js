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
        (SELECT COALESCE(SUM(d.montant), 0)::numeric FROM decaissements d
         WHERE d.boss_id = $1) AS total_decaisse,
        (SELECT COALESCE(SUM(p.stock), 0)::int FROM produits p
         JOIN grossistes g ON g.id = p.grossiste_id WHERE g.boss_id = $1) AS stock_global`,
      [bossId]
    )

    const stats = statsResult.rows[0]
    stats.solde = parseFloat(stats.chiffre_affaires) - parseFloat(stats.total_decaisse || 0)

    const grossistesResult = await pool.query(
      `SELECT
        g.id, g.nom, g.logo, g.actif,
        COALESCE((SELECT SUM(v.total) FROM ventes v WHERE v.grossiste_id = g.id), 0)::numeric AS ca_brut,
        COALESCE((SELECT SUM(d.montant) FROM decaissements d WHERE d.grossiste_id = g.id), 0)::numeric AS total_decaisse,
        (SELECT COUNT(*)::int FROM produits p WHERE p.grossiste_id = g.id) AS nb_produits,
        (SELECT COUNT(*)::int FROM clients c WHERE c.grossiste_id = g.id) AS nb_clients,
        (SELECT COUNT(*)::int FROM employes e WHERE e.grossiste_id = g.id AND e.actif = true) AS nb_employes,
        (SELECT COUNT(*)::int FROM produits p WHERE p.grossiste_id = g.id AND p.stock <= p.stock_min) AS stock_faible
       FROM grossistes g
       WHERE g.boss_id = $1
       ORDER BY g.nom`,
      [bossId]
    )

    const grossistes = grossistesResult.rows.map(g => ({
      ...g,
      chiffre_affaires: parseFloat(g.ca_brut) - parseFloat(g.total_decaisse || 0),
      ca_brut: parseFloat(g.ca_brut),
      total_decaisse: parseFloat(g.total_decaisse || 0)
    }))

    const topProduitResult = await pool.query(
      `SELECT p.id, p.nom, COALESCE(SUM(lv.quantite), 0)::numeric AS quantite_vendue
       FROM lignes_vente lv
       JOIN ventes v ON v.id = lv.vente_id
       JOIN produits p ON p.id = lv.produit_id
       JOIN grossistes g ON g.id = v.grossiste_id
       WHERE g.boss_id = $1
       GROUP BY p.id, p.nom
       ORDER BY quantite_vendue DESC
       LIMIT 1`,
      [bossId]
    )

    const bottomProduitResult = await pool.query(
      `SELECT p.id, p.nom, COALESCE(SUM(lv.quantite), 0)::numeric AS quantite_vendue
       FROM produits p
       JOIN grossistes g ON g.id = p.grossiste_id
       LEFT JOIN lignes_vente lv ON lv.produit_id = p.id
       LEFT JOIN ventes v ON v.id = lv.vente_id AND v.grossiste_id = p.grossiste_id
       WHERE g.boss_id = $1
       GROUP BY p.id, p.nom
       ORDER BY quantite_vendue ASC, p.nom ASC
       LIMIT 1`,
      [bossId]
    )

    const ventesParProduitResult = await pool.query(
      `SELECT p.nom, COALESCE(SUM(lv.quantite), 0)::numeric AS quantite_vendue
       FROM lignes_vente lv
       JOIN ventes v ON v.id = lv.vente_id
       JOIN produits p ON p.id = lv.produit_id
       JOIN grossistes g ON g.id = v.grossiste_id
       WHERE g.boss_id = $1
       GROUP BY p.id, p.nom
       HAVING COALESCE(SUM(lv.quantite), 0) > 0
       ORDER BY quantite_vendue DESC
       LIMIT 10`,
      [bossId]
    )

    const peremptionResult = await pool.query(
      `SELECT p.id, p.nom, p.date_peremption, p.stock, p.unite_vente, g.nom AS grossiste_nom
       FROM produits p
       JOIN grossistes g ON g.id = p.grossiste_id
       WHERE g.boss_id = $1
         AND p.date_peremption IS NOT NULL
         AND p.date_peremption <= CURRENT_DATE + INTERVAL '30 days'
       ORDER BY p.date_peremption ASC
       LIMIT 15`,
      [bossId]
    )

    const stockFaibleResult = await pool.query(
      `SELECT p.id, p.nom, p.stock, p.stock_min, p.unite_vente, g.nom AS grossiste_nom
       FROM produits p
       JOIN grossistes g ON g.id = p.grossiste_id
       WHERE g.boss_id = $1 AND p.stock <= p.stock_min
       ORDER BY p.stock ASC
       LIMIT 15`,
      [bossId]
    )

    res.json({
      stats: {
        ...stats,
        produit_plus_vendu: topProduitResult.rows[0] || null,
        produit_moins_vendu: bottomProduitResult.rows[0] || null,
        ventes_par_produit: ventesParProduitResult.rows,
        produits_peremption: peremptionResult.rows,
        produits_stock_faible: stockFaibleResult.rows
      },
      grossistes
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
