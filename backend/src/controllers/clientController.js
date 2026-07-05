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

export async function listClients (req, res, next) {
  try {
    const grossisteId = getGrossisteId(req)
    if (!grossisteId || !(await assertGrossisteAccess(req, grossisteId))) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { rows } = await pool.query(
      'SELECT * FROM clients WHERE grossiste_id = $1 ORDER BY nom',
      [grossisteId]
    )
    res.json(rows)
  } catch (err) {
    next(err)
  }
}

export async function createClient (req, res, next) {
  try {
    const grossisteId = getGrossisteId(req)
    if (!grossisteId || !(await assertGrossisteAccess(req, grossisteId))) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { nom, telephone, adresse, email } = req.body
    if (!nom) return res.status(400).json({ message: 'Le nom est obligatoire' })

    const { rows } = await pool.query(
      `INSERT INTO clients (grossiste_id, nom, telephone, adresse, email)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [grossisteId, nom, telephone, adresse, email]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    next(err)
  }
}

export async function updateClient (req, res, next) {
  try {
    const grossisteId = getGrossisteId(req)
    if (!grossisteId || !(await assertGrossisteAccess(req, grossisteId))) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { nom, telephone, adresse, email } = req.body
    const { rows } = await pool.query(
      `UPDATE clients SET
        nom = COALESCE($1, nom),
        telephone = COALESCE($2, telephone),
        adresse = COALESCE($3, adresse),
        email = COALESCE($4, email)
       WHERE id = $5 AND grossiste_id = $6 RETURNING *`,
      [nom, telephone, adresse, email, req.params.id, grossisteId]
    )
    if (!rows.length) return res.status(404).json({ message: 'Client introuvable' })
    res.json(rows[0])
  } catch (err) {
    next(err)
  }
}

export async function deleteClient (req, res, next) {
  try {
    const grossisteId = getGrossisteId(req)
    if (!grossisteId || !(await assertGrossisteAccess(req, grossisteId))) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { rowCount } = await pool.query(
      'DELETE FROM clients WHERE id = $1 AND grossiste_id = $2',
      [req.params.id, grossisteId]
    )
    if (!rowCount) return res.status(404).json({ message: 'Client introuvable' })
    res.json({ message: 'Client supprimé' })
  } catch (err) {
    next(err)
  }
}
