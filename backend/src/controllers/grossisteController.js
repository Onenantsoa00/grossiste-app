import pool from '../config/db.js'

export async function listGrossistes (req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, nom, logo, telephone, email, adresse, nif, stat, description, actif, created_at
       FROM grossistes WHERE boss_id = $1 ORDER BY nom`,
      [req.user.id]
    )
    res.json(rows)
  } catch (err) {
    next(err)
  }
}

export async function getGrossiste (req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM grossistes WHERE id = $1 AND boss_id = $2`,
      [req.params.id, req.user.id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Grossiste introuvable' })
    res.json(rows[0])
  } catch (err) {
    next(err)
  }
}

export async function createGrossiste (req, res, next) {
  try {
    const { nom, logo, telephone, email, adresse, nif, stat, description } = req.body
    if (!nom) return res.status(400).json({ message: 'Le nom est obligatoire' })

    const { rows } = await pool.query(
      `INSERT INTO grossistes (boss_id, nom, logo, telephone, email, adresse, nif, stat, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.user.id, nom, logo, telephone, email, adresse, nif, stat, description]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    next(err)
  }
}

export async function updateGrossiste (req, res, next) {
  try {
    const { nom, logo, telephone, email, adresse, nif, stat, description, actif } = req.body

    const { rows } = await pool.query(
      `UPDATE grossistes SET
        nom = COALESCE($1, nom),
        logo = COALESCE($2, logo),
        telephone = COALESCE($3, telephone),
        email = COALESCE($4, email),
        adresse = COALESCE($5, adresse),
        nif = COALESCE($6, nif),
        stat = COALESCE($7, stat),
        description = COALESCE($8, description),
        actif = COALESCE($9, actif),
        updated_at = NOW()
       WHERE id = $10 AND boss_id = $11
       RETURNING *`,
      [nom, logo, telephone, email, adresse, nif, stat, description, actif, req.params.id, req.user.id]
    )

    if (!rows.length) return res.status(404).json({ message: 'Grossiste introuvable' })
    res.json(rows[0])
  } catch (err) {
    next(err)
  }
}

export async function deleteGrossiste (req, res, next) {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM grossistes WHERE id = $1 AND boss_id = $2',
      [req.params.id, req.user.id]
    )
    if (!rowCount) return res.status(404).json({ message: 'Grossiste introuvable' })
    res.json({ message: 'Grossiste supprimé' })
  } catch (err) {
    next(err)
  }
}

export async function toggleGrossiste (req, res, next) {
  try {
    const { actif } = req.body
    if (typeof actif !== 'boolean') {
      return res.status(400).json({ message: 'Le champ actif (boolean) est requis' })
    }

    const { rows } = await pool.query(
      `UPDATE grossistes SET actif = $1, updated_at = NOW()
       WHERE id = $2 AND boss_id = $3 RETURNING *`,
      [actif, req.params.id, req.user.id]
    )

    if (!rows.length) return res.status(404).json({ message: 'Grossiste introuvable' })
    res.json(rows[0])
  } catch (err) {
    next(err)
  }
}
