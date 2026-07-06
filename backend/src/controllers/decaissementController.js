import pool from '../config/db.js'

async function assertBossGrossiste (bossId, grossisteId) {
  const { rows } = await pool.query(
    'SELECT id FROM grossistes WHERE id = $1 AND boss_id = $2',
    [grossisteId, bossId]
  )
  return rows.length > 0
}

async function getGrossisteSolde (bossId, grossisteId) {
  const { rows } = await pool.query(
    `SELECT
      COALESCE((SELECT SUM(total) FROM ventes WHERE grossiste_id = $2), 0)::numeric AS ca_brut,
      COALESCE((SELECT SUM(montant) FROM decaissements WHERE grossiste_id = $2 AND boss_id = $1), 0)::numeric AS total_decaisse`,
    [bossId, grossisteId]
  )
  const ca = parseFloat(rows[0].ca_brut)
  const decaisse = parseFloat(rows[0].total_decaisse)
  return { ca_brut: ca, total_decaisse: decaisse, solde: ca - decaisse }
}

export async function listDecaissements (req, res, next) {
  try {
    const bossId = req.user.id
    const { rows } = await pool.query(
      `SELECT d.*, g.nom AS grossiste_nom
       FROM decaissements d
       LEFT JOIN grossistes g ON g.id = d.grossiste_id
       WHERE d.boss_id = $1
       ORDER BY d.date DESC`,
      [bossId]
    )
    res.json(rows)
  } catch (err) {
    next(err)
  }
}

export async function getDecaissementStats (req, res, next) {
  try {
    const bossId = req.user.id
    const grossisteId = req.query.grossiste_id

    if (grossisteId) {
      if (!(await assertBossGrossiste(bossId, grossisteId))) {
        return res.status(403).json({ message: 'Grossiste non autorisé' })
      }
      const solde = await getGrossisteSolde(bossId, grossisteId)
      return res.json(solde)
    }

    const caResult = await pool.query(
      `SELECT COALESCE(SUM(v.total), 0)::numeric AS chiffre_affaires
       FROM ventes v
       JOIN grossistes g ON g.id = v.grossiste_id
       WHERE g.boss_id = $1`,
      [bossId]
    )

    const decaisseResult = await pool.query(
      `SELECT COALESCE(SUM(montant), 0)::numeric AS total_decaisse
       FROM decaissements WHERE boss_id = $1`,
      [bossId]
    )

    const grossistesResult = await pool.query(
      `SELECT g.id, g.nom,
        COALESCE((SELECT SUM(v.total) FROM ventes v WHERE v.grossiste_id = g.id), 0)::numeric AS ca_brut,
        COALESCE((SELECT SUM(d.montant) FROM decaissements d WHERE d.grossiste_id = g.id), 0)::numeric AS total_decaisse
       FROM grossistes g
       WHERE g.boss_id = $1
       ORDER BY g.nom`,
      [bossId]
    )

    const ca = parseFloat(caResult.rows[0].chiffre_affaires)
    const decaisse = parseFloat(decaisseResult.rows[0].total_decaisse)

    res.json({
      chiffre_affaires: ca,
      total_decaisse: decaisse,
      solde: ca - decaisse,
      grossistes: grossistesResult.rows.map(g => ({
        id: g.id,
        nom: g.nom,
        ca_brut: parseFloat(g.ca_brut),
        total_decaisse: parseFloat(g.total_decaisse),
        solde: parseFloat(g.ca_brut) - parseFloat(g.total_decaisse)
      }))
    })
  } catch (err) {
    next(err)
  }
}

export async function createDecaissement (req, res, next) {
  try {
    const bossId = req.user.id
    const { grossiste_id, montant, motif } = req.body

    if (!grossiste_id) {
      return res.status(400).json({ message: 'Le grossiste est obligatoire' })
    }

    const m = parseFloat(montant)
    if (!Number.isFinite(m) || m <= 0) {
      return res.status(400).json({ message: 'Montant invalide' })
    }

    if (!(await assertBossGrossiste(bossId, grossiste_id))) {
      return res.status(403).json({ message: 'Grossiste non autorisé' })
    }

    const { solde } = await getGrossisteSolde(bossId, grossiste_id)
    if (m > solde) {
      return res.status(400).json({
        message: `Montant supérieur au CA disponible du grossiste (solde : ${solde.toFixed(2)} Ar)`
      })
    }

    const { rows } = await pool.query(
      `INSERT INTO decaissements (boss_id, grossiste_id, montant, motif)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [bossId, grossiste_id, m, motif || null]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    next(err)
  }
}

export async function deleteDecaissement (req, res, next) {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM decaissements WHERE id = $1 AND boss_id = $2',
      [req.params.id, req.user.id]
    )
    if (!rowCount) return res.status(404).json({ message: 'Décaissement introuvable' })
    res.json({ message: 'Décaissement supprimé' })
  } catch (err) {
    next(err)
  }
}
