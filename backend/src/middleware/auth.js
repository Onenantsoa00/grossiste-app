import { verifyToken } from '../utils/jwt.js'
import pool from '../config/db.js'

export function authenticate (req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant' })
  }

  try {
    const token = header.slice(7)
    req.user = verifyToken(token)
    next()
  } catch {
    return res.status(401).json({ message: 'Token invalide ou expiré' })
  }
}

export function requireBoss (req, res, next) {
  if (req.user?.role !== 'boss') {
    return res.status(403).json({ message: 'Accès réservé au Boss' })
  }
  next()
}

export function requireEmploye (req, res, next) {
  if (req.user?.role !== 'employe') {
    return res.status(403).json({ message: 'Accès réservé aux employés' })
  }
  next()
}

/** Vérifie que le grossiste appartient au Boss connecté */
export async function requireBossGrossiste (req, res, next) {
  const grossisteId = req.params.grossisteId || req.params.id || req.body.grossiste_id

  if (!grossisteId) {
    return res.status(400).json({ message: 'ID grossiste requis' })
  }

  const { rows } = await pool.query(
    'SELECT id FROM grossistes WHERE id = $1 AND boss_id = $2',
    [grossisteId, req.user.id]
  )

  if (!rows.length) {
    return res.status(403).json({ message: 'Grossiste non autorisé' })
  }

  req.grossisteId = grossisteId
  next()
}

/** Contexte grossiste actif (Boss en mode impersonation ou Employé) */
export function resolveGrossisteContext (req, res, next) {
  const headerGrossiste = req.headers['x-grossiste-id']

  if (req.user.role === 'employe') {
    req.grossisteId = req.user.grossiste_id
    return next()
  }

  if (req.user.role === 'boss') {
    req.grossisteId = headerGrossiste || req.params.grossisteId || null
    return next()
  }

  return res.status(403).json({ message: 'Rôle non reconnu' })
}

export async function requireGrossisteAccess (req, res, next) {
  const grossisteId = req.grossisteId || req.params.grossisteId

  if (!grossisteId) {
    return res.status(400).json({ message: 'Contexte grossiste requis' })
  }

  if (req.user.role === 'employe') {
    if (req.user.grossiste_id !== grossisteId) {
      return res.status(403).json({ message: 'Accès au grossiste refusé' })
    }
    return next()
  }

  const { rows } = await pool.query(
    'SELECT id, actif FROM grossistes WHERE id = $1 AND boss_id = $2',
    [grossisteId, req.user.id]
  )

  if (!rows.length) {
    return res.status(403).json({ message: 'Grossiste non autorisé' })
  }

  if (!rows[0].actif) {
    return res.status(403).json({ message: 'Ce grossiste est désactivé' })
  }

  req.grossisteId = grossisteId
  next()
}
