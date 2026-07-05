import bcrypt from 'bcrypt'
import pool from '../config/db.js'

const SALT_ROUNDS = 10

export async function listEmployes (req, res, next) {
  try {
    const { grossisteId } = req.query
    let query = `
      SELECT e.id, e.nom, e.prenom, e.telephone, e.email, e.actif, e.grossiste_id, e.created_at,
             g.nom AS grossiste_nom
      FROM employes e
      JOIN grossistes g ON g.id = e.grossiste_id
      WHERE g.boss_id = $1`
    const params = [req.user.id]

    if (grossisteId) {
      query += ' AND e.grossiste_id = $2'
      params.push(grossisteId)
    }

    query += ' ORDER BY e.nom'

    const { rows } = await pool.query(query, params)
    res.json(rows)
  } catch (err) {
    next(err)
  }
}

export async function createEmploye (req, res, next) {
  try {
    const { nom, prenom, telephone, email, password, grossiste_id } = req.body

    if (!nom || !email || !password || !grossiste_id) {
      return res.status(400).json({ message: 'Nom, email, mot de passe et grossiste requis' })
    }

    const grossisteCheck = await pool.query(
      'SELECT id FROM grossistes WHERE id = $1 AND boss_id = $2',
      [grossiste_id, req.user.id]
    )
    if (!grossisteCheck.rows.length) {
      return res.status(403).json({ message: 'Grossiste non autorisé' })
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS)

    const { rows } = await pool.query(
      `INSERT INTO employes (grossiste_id, nom, prenom, telephone, email, password)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nom, prenom, telephone, email, actif, grossiste_id, created_at`,
      [grossiste_id, nom, prenom, telephone, email.toLowerCase(), hash]
    )

    res.status(201).json(rows[0])
  } catch (err) {
    next(err)
  }
}

export async function updateEmploye (req, res, next) {
  try {
    const { nom, prenom, telephone, email, grossiste_id, actif } = req.body

    const check = await pool.query(
      `SELECT e.id FROM employes e
       JOIN grossistes g ON g.id = e.grossiste_id
       WHERE e.id = $1 AND g.boss_id = $2`,
      [req.params.id, req.user.id]
    )
    if (!check.rows.length) return res.status(404).json({ message: 'Employé introuvable' })

    if (grossiste_id) {
      const grossisteCheck = await pool.query(
        'SELECT id FROM grossistes WHERE id = $1 AND boss_id = $2',
        [grossiste_id, req.user.id]
      )
      if (!grossisteCheck.rows.length) {
        return res.status(403).json({ message: 'Grossiste non autorisé' })
      }
    }

    const { rows } = await pool.query(
      `UPDATE employes SET
        nom = COALESCE($1, nom),
        prenom = COALESCE($2, prenom),
        telephone = COALESCE($3, telephone),
        email = COALESCE($4, email),
        grossiste_id = COALESCE($5, grossiste_id),
        actif = COALESCE($6, actif),
        updated_at = NOW()
       WHERE id = $7
       RETURNING id, nom, prenom, telephone, email, actif, grossiste_id, created_at`,
      [nom, prenom, telephone, email?.toLowerCase(), grossiste_id, actif, req.params.id]
    )

    res.json(rows[0])
  } catch (err) {
    next(err)
  }
}

export async function deleteEmploye (req, res, next) {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM employes e
       USING grossistes g
       WHERE e.id = $1 AND e.grossiste_id = g.id AND g.boss_id = $2`,
      [req.params.id, req.user.id]
    )
    if (!rowCount) return res.status(404).json({ message: 'Employé introuvable' })
    res.json({ message: 'Employé supprimé' })
  } catch (err) {
    next(err)
  }
}

export async function resetEmployePassword (req, res, next) {
  try {
    const { password } = req.body
    if (!password) return res.status(400).json({ message: 'Nouveau mot de passe requis' })

    const check = await pool.query(
      `SELECT e.id FROM employes e
       JOIN grossistes g ON g.id = e.grossiste_id
       WHERE e.id = $1 AND g.boss_id = $2`,
      [req.params.id, req.user.id]
    )
    if (!check.rows.length) return res.status(404).json({ message: 'Employé introuvable' })

    const hash = await bcrypt.hash(password, SALT_ROUNDS)
    await pool.query(
      'UPDATE employes SET password = $1, updated_at = NOW() WHERE id = $2',
      [hash, req.params.id]
    )

    res.json({ message: 'Mot de passe réinitialisé' })
  } catch (err) {
    next(err)
  }
}
