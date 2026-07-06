import pool from '../config/db.js'

const VALID_UNITES = ['piece', 'kg']

function parseQuantite (value, uniteVente = 'piece') {
  const q = parseFloat(value)
  if (!Number.isFinite(q) || q <= 0) return null
  if (uniteVente === 'piece' && !Number.isInteger(q)) return null
  return uniteVente === 'kg' ? Math.round(q * 1000) / 1000 : q
}

const GROSSISTE_FIELDS = 'grossiste_id'

async function assertGrossisteAccess (req, grossisteId) {
  if (req.user.role === 'employe') {
    return req.user.grossiste_id === grossisteId
  }
  const { rows } = await pool.query(
    'SELECT id FROM grossistes WHERE id = $1 AND boss_id = $2 AND actif = true',
    [grossisteId, req.user.id]
  )
  return rows.length > 0
}

function getGrossisteId (req) {
  return req.grossisteId || req.user.grossiste_id || req.query.grossiste_id
}

export async function listProduits (req, res, next) {
  try {
    const grossisteId = getGrossisteId(req)
    if (!grossisteId || !(await assertGrossisteAccess(req, grossisteId))) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { categorie_id, q } = req.query
    const conditions = ['p.grossiste_id = $1']
    const params = [grossisteId]
    let i = 2

    if (categorie_id) {
      conditions.push(`p.categorie_id = $${i++}`)
      params.push(categorie_id)
    }

    if (q?.trim()) {
      conditions.push(`(
        p.nom ILIKE $${i} OR p.reference ILIKE $${i} OR p.code_barre ILIKE $${i}
      )`)
      params.push(`%${q.trim()}%`)
      i++
    }

    const { rows } = await pool.query(
      `SELECT p.*, c.nom AS categorie_nom, m.nom AS marque_nom, f.nom AS fournisseur_nom
       FROM produits p
       LEFT JOIN categories c ON c.id = p.categorie_id
       LEFT JOIN marques m ON m.id = p.marque_id
       LEFT JOIN fournisseurs f ON f.id = p.fournisseur_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY p.nom`,
      params
    )
    res.json(rows)
  } catch (err) {
    next(err)
  }
}

export async function createProduit (req, res, next) {
  try {
    const grossisteId = getGrossisteId(req)
    if (!grossisteId || !(await assertGrossisteAccess(req, grossisteId))) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const {
      nom, description, reference, code_barre,
      prix_achat, prix_vente, prix_grossiste, prix_carton, prix_sac,
      qte_par_carton, qte_par_sac,
      stock, stock_min, image, unite_vente,
      categorie_id, marque_id, fournisseur_id,
      date_peremption
    } = req.body

    if (!nom) return res.status(400).json({ message: 'Le nom est obligatoire' })
    if (unite_vente && !VALID_UNITES.includes(unite_vente)) {
      return res.status(400).json({ message: 'Unité de vente invalide (piece ou kg)' })
    }

    const { rows } = await pool.query(
      `INSERT INTO produits (
        grossiste_id, nom, description, reference, code_barre,
        prix_achat, prix_vente, prix_grossiste, prix_carton, prix_sac,
        qte_par_carton, qte_par_sac,
        stock, stock_min, image,
        unite_vente, categorie_id, marque_id, fournisseur_id, date_peremption
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      RETURNING *`,
      [
        grossisteId, nom, description, reference, code_barre,
        prix_achat ?? 0, prix_vente ?? 0, prix_grossiste ?? 0,
        prix_carton ?? 0, prix_sac ?? 0,
        qte_par_carton ?? 0, qte_par_sac ?? 0,
        stock ?? 0, stock_min ?? 0, image,
        unite_vente ?? 'piece',
        categorie_id || null, marque_id || null, fournisseur_id || null,
        date_peremption || null
      ]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    next(err)
  }
}

export async function updateProduit (req, res, next) {
  try {
    const grossisteId = getGrossisteId(req)
    if (!grossisteId || !(await assertGrossisteAccess(req, grossisteId))) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const fields = [
      'nom', 'description', 'reference', 'code_barre',
      'prix_achat', 'prix_vente', 'prix_grossiste', 'prix_carton', 'prix_sac',
      'qte_par_carton', 'qte_par_sac',
      'stock', 'stock_min', 'image', 'unite_vente',
      'categorie_id', 'marque_id', 'fournisseur_id', 'date_peremption'
    ]

    if (req.body.unite_vente !== undefined && !VALID_UNITES.includes(req.body.unite_vente)) {
      return res.status(400).json({ message: 'Unité de vente invalide (piece ou kg)' })
    }

    const updates = []
    const values = []
    let i = 1

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${i++}`)
        values.push(req.body[field])
      }
    }

    if (!updates.length) return res.status(400).json({ message: 'Aucune donnée à mettre à jour' })

    values.push(req.params.id, grossisteId)

    const { rows } = await pool.query(
      `UPDATE produits SET ${updates.join(', ')}
       WHERE id = $${i++} AND grossiste_id = $${i}
       RETURNING *`,
      values
    )

    if (!rows.length) return res.status(404).json({ message: 'Produit introuvable' })
    res.json(rows[0])
  } catch (err) {
    next(err)
  }
}

export async function deleteProduit (req, res, next) {
  try {
    const grossisteId = getGrossisteId(req)
    if (!grossisteId || !(await assertGrossisteAccess(req, grossisteId))) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { rowCount } = await pool.query(
      'DELETE FROM produits WHERE id = $1 AND grossiste_id = $2',
      [req.params.id, grossisteId]
    )
    if (!rowCount) return res.status(404).json({ message: 'Produit introuvable' })
    res.json({ message: 'Produit supprimé' })
  } catch (err) {
    next(err)
  }
}
