import pool from '../config/db.js'

async function assertGrossisteAccess (req, grossisteId) {
  if (req.user.role === 'employe') {
    return req.user.grossiste_id === grossisteId
  }
  const { rows } = await pool.query(
    'SELECT id FROM grossistes WHERE id = $1 AND boss_id = $2',
    [grossisteId, req.user.id]
  )
  return rows.length > 0
}

function getGrossisteId (req) {
  return req.grossisteId || req.user.grossiste_id || req.body.grossiste_id
}

export async function listMouvements (req, res, next) {
  try {
    const grossisteId = getGrossisteId(req)
    if (!grossisteId || !(await assertGrossisteAccess(req, grossisteId))) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { rows } = await pool.query(
      `SELECT ms.*, p.nom AS produit_nom
       FROM mouvements_stock ms
       JOIN produits p ON p.id = ms.produit_id
       WHERE ms.grossiste_id = $1
       ORDER BY ms.date DESC`,
      [grossisteId]
    )
    res.json(rows)
  } catch (err) {
    next(err)
  }
}

export async function createMouvement (req, res, next) {
  const client = await pool.connect()
  try {
    const grossisteId = getGrossisteId(req)
    if (!grossisteId || !(await assertGrossisteAccess(req, grossisteId))) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { produit_id, type, quantite, motif } = req.body
    const validTypes = ['entree', 'sortie', 'inventaire', 'ajustement']

    if (!produit_id || !type || !quantite) {
      return res.status(400).json({ message: 'Produit, type et quantité requis' })
    }
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Type invalide' })
    }

    await client.query('BEGIN')

    const produitResult = await client.query(
      'SELECT stock FROM produits WHERE id = $1 AND grossiste_id = $2 FOR UPDATE',
      [produit_id, grossisteId]
    )
    if (!produitResult.rows.length) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Produit introuvable' })
    }

    let newStock = parseInt(produitResult.rows[0].stock, 10)

    if (type === 'entree') newStock += parseInt(quantite, 10)
    else if (type === 'sortie') newStock -= parseInt(quantite, 10)
    else if (type === 'inventaire' || type === 'ajustement') newStock = parseInt(quantite, 10)

    if (newStock < 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'Stock insuffisant' })
    }

    const utilisateurId = req.user.role === 'employe' ? req.user.id : null

    const mvResult = await client.query(
      `INSERT INTO mouvements_stock (grossiste_id, produit_id, type, quantite, motif, utilisateur_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [grossisteId, produit_id, type, quantite, motif, utilisateurId]
    )

    await client.query(
      'UPDATE produits SET stock = $1 WHERE id = $2',
      [newStock, produit_id]
    )

    await client.query('COMMIT')
    res.status(201).json({ ...mvResult.rows[0], nouveau_stock: newStock })
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
}

export async function getAlertes (req, res, next) {
  try {
    const grossisteId = getGrossisteId(req)
    if (!grossisteId || !(await assertGrossisteAccess(req, grossisteId))) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { rows } = await pool.query(
      `SELECT id, nom, stock, stock_min, reference
       FROM produits
       WHERE grossiste_id = $1 AND stock <= stock_min
       ORDER BY stock ASC`,
      [grossisteId]
    )
    res.json(rows)
  } catch (err) {
    next(err)
  }
}
