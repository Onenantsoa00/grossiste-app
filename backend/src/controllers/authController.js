import bcrypt from 'bcrypt'
import crypto from 'crypto'
import pool from '../config/db.js'
import { signToken } from '../utils/jwt.js'

const SALT_ROUNDS = 10

function buildUserResponse (user, role, extra = {}) {
  return {
    id: user.id,
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    telephone: user.telephone,
    role,
    ...extra
  }
}

export async function registerBoss (req, res, next) {
  try {
    const { nom, prenom, email, telephone, password } = req.body

    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' })
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS)

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const bossResult = await client.query(
        `INSERT INTO bosses (nom, prenom, email, telephone, password)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, nom, prenom, email, telephone`,
        [nom, prenom, email.toLowerCase(), telephone || null, hash]
      )

      const boss = bossResult.rows[0]

      await client.query(
        `INSERT INTO parametres_entreprise (boss_id, nom_entreprise)
         VALUES ($1, $2)`,
        [boss.id, `${prenom} ${nom}`]
      )

      await client.query('COMMIT')

      const token = signToken({ id: boss.id, role: 'boss', email: boss.email })
      res.status(201).json({ token, user: buildUserResponse(boss, 'boss') })
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  } catch (err) {
    next(err)
  }
}

export async function login (req, res, next) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' })
    }

    const normalizedEmail = email.toLowerCase()

    const bossResult = await pool.query(
      'SELECT * FROM bosses WHERE email = $1',
      [normalizedEmail]
    )

    if (bossResult.rows.length) {
      const boss = bossResult.rows[0]
      const valid = await bcrypt.compare(password, boss.password)
      if (!valid) {
        return res.status(401).json({ message: 'Identifiants incorrects' })
      }

      const token = signToken({ id: boss.id, role: 'boss', email: boss.email })
      return res.json({ token, user: buildUserResponse(boss, 'boss') })
    }

    const employeResult = await pool.query(
      `SELECT e.*, g.nom AS grossiste_nom, g.boss_id
       FROM employes e
       JOIN grossistes g ON g.id = e.grossiste_id
       WHERE e.email = $1`,
      [normalizedEmail]
    )

    if (!employeResult.rows.length) {
      return res.status(401).json({ message: 'Identifiants incorrects' })
    }

    const employe = employeResult.rows[0]

    if (!employe.actif) {
      return res.status(403).json({ message: 'Compte employé bloqué' })
    }

    const valid = await bcrypt.compare(password, employe.password)
    if (!valid) {
      return res.status(401).json({ message: 'Identifiants incorrects' })
    }

    const token = signToken({
      id: employe.id,
      role: 'employe',
      email: employe.email,
      grossiste_id: employe.grossiste_id,
      boss_id: employe.boss_id
    })

    res.json({
      token,
      user: buildUserResponse(employe, 'employe', {
        grossiste_id: employe.grossiste_id,
        grossiste_nom: employe.grossiste_nom
      })
    })
  } catch (err) {
    next(err)
  }
}

export async function me (req, res, next) {
  try {
    if (req.user.role === 'boss') {
      const { rows } = await pool.query(
        'SELECT id, nom, prenom, email, telephone FROM bosses WHERE id = $1',
        [req.user.id]
      )
      if (!rows.length) return res.status(404).json({ message: 'Utilisateur introuvable' })
      return res.json(buildUserResponse(rows[0], 'boss'))
    }

    const { rows } = await pool.query(
      `SELECT e.id, e.nom, e.prenom, e.email, e.telephone, e.grossiste_id, g.nom AS grossiste_nom
       FROM employes e
       JOIN grossistes g ON g.id = e.grossiste_id
       WHERE e.id = $1`,
      [req.user.id]
    )

    if (!rows.length) return res.status(404).json({ message: 'Utilisateur introuvable' })

    const employe = rows[0]
    res.json(buildUserResponse(employe, 'employe', {
      grossiste_id: employe.grossiste_id,
      grossiste_nom: employe.grossiste_nom
    }))
  } catch (err) {
    next(err)
  }
}

export async function forgotPassword (req, res, next) {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ message: 'Email requis' })
    }

    const normalizedEmail = email.toLowerCase()
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 3600000)

    let userType = null
    const bossCheck = await pool.query('SELECT id FROM bosses WHERE email = $1', [normalizedEmail])
    if (bossCheck.rows.length) userType = 'boss'
    else {
      const employeCheck = await pool.query('SELECT id FROM employes WHERE email = $1', [normalizedEmail])
      if (employeCheck.rows.length) userType = 'employe'
    }

    if (userType) {
      await pool.query('DELETE FROM password_resets WHERE email = $1', [normalizedEmail])
      await pool.query(
        `INSERT INTO password_resets (email, token, user_type, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [normalizedEmail, token, userType, expiresAt]
      )
      // En production : envoyer l'email avec le lien de réinitialisation
      if (process.env.NODE_ENV === 'development') {
        return res.json({
          message: 'Si cet email existe, un lien de réinitialisation a été envoyé',
          dev_token: token
        })
      }
    }

    res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé' })
  } catch (err) {
    next(err)
  }
}

export async function resetPassword (req, res, next) {
  try {
    const { token, password } = req.body
    if (!token || !password) {
      return res.status(400).json({ message: 'Token et nouveau mot de passe requis' })
    }

    const { rows } = await pool.query(
      `SELECT * FROM password_resets
       WHERE token = $1 AND expires_at > NOW()`,
      [token]
    )

    if (!rows.length) {
      return res.status(400).json({ message: 'Token invalide ou expiré' })
    }

    const reset = rows[0]
    const hash = await bcrypt.hash(password, SALT_ROUNDS)
    const table = reset.user_type === 'boss' ? 'bosses' : 'employes'

    await pool.query(`UPDATE ${table} SET password = $1, updated_at = NOW() WHERE email = $2`, [hash, reset.email])
    await pool.query('DELETE FROM password_resets WHERE email = $1', [reset.email])

    res.json({ message: 'Mot de passe réinitialisé avec succès' })
  } catch (err) {
    next(err)
  }
}
