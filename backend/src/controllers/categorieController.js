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

export async function listCategories (req, res, next) {
  try {
    const grossisteId = getGrossisteId(req)
    if (!grossisteId || !(await assertGrossisteAccess(req, grossisteId))) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { rows } = await pool.query(
      `SELECT c.*, (SELECT COUNT(*)::int FROM produits p WHERE p.categorie_id = c.id) AS nb_produits
       FROM categories c
       WHERE c.grossiste_id = $1
       ORDER BY c.nom`,
      [grossisteId]
    )
    res.json(rows)
  } catch (err) {
    next(err)
  }
}

export async function createCategorie (req, res, next) {
  try {
    const grossisteId = getGrossisteId(req)
    if (!grossisteId || !(await assertGrossisteAccess(req, grossisteId))) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { nom, description } = req.body
    if (!nom?.trim()) return res.status(400).json({ message: 'Le nom est obligatoire' })

    const { rows } = await pool.query(
      `INSERT INTO categories (grossiste_id, nom, description)
       VALUES ($1, $2, $3) RETURNING *`,
      [grossisteId, nom.trim(), description || null]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    next(err)
  }
}

export async function updateCategorie (req, res, next) {
  try {
    const grossisteId = getGrossisteId(req)
    if (!grossisteId || !(await assertGrossisteAccess(req, grossisteId))) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { nom, description } = req.body
    const { rows } = await pool.query(
      `UPDATE categories SET
        nom = COALESCE($1, nom),
        description = COALESCE($2, description)
       WHERE id = $3 AND grossiste_id = $4 RETURNING *`,
      [nom, description, req.params.id, grossisteId]
    )
    if (!rows.length) return res.status(404).json({ message: 'Catégorie introuvable' })
    res.json(rows[0])
  } catch (err) {
    next(err)
  }
}

export async function deleteCategorie (req, res, next) {
  try {
    const grossisteId = getGrossisteId(req)
    if (!grossisteId || !(await assertGrossisteAccess(req, grossisteId))) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { rowCount } = await pool.query(
      'DELETE FROM categories WHERE id = $1 AND grossiste_id = $2',
      [req.params.id, grossisteId]
    )
    if (!rowCount) return res.status(404).json({ message: 'Catégorie introuvable' })
    res.json({ message: 'Catégorie supprimée' })
  } catch (err) {
    next(err)
  }
}
