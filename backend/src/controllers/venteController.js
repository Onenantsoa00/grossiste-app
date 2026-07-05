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

async function generateNumero (client, grossisteId) {
  const countResult = await client.query(
    'SELECT COUNT(*)::int AS c FROM ventes WHERE grossiste_id = $1',
    [grossisteId]
  )
  const seq = countResult.rows[0].c + 1
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `V-${date}-${String(seq).padStart(4, '0')}`
}

export async function listVentes (req, res, next) {
  try {
    const grossisteId = getGrossisteId(req)
    if (!grossisteId || !(await assertGrossisteAccess(req, grossisteId))) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { rows } = await pool.query(
      `SELECT v.*, c.nom AS client_nom
       FROM ventes v
       LEFT JOIN clients c ON c.id = v.client_id
       WHERE v.grossiste_id = $1
       ORDER BY v.date DESC`,
      [grossisteId]
    )
    res.json(rows)
  } catch (err) {
    next(err)
  }
}

export async function getVente (req, res, next) {
  try {
    const grossisteId = getGrossisteId(req)
    if (!grossisteId || !(await assertGrossisteAccess(req, grossisteId))) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const venteResult = await pool.query(
      `SELECT v.*, c.nom AS client_nom, c.telephone AS client_telephone
       FROM ventes v
       LEFT JOIN clients c ON c.id = v.client_id
       WHERE v.id = $1 AND v.grossiste_id = $2`,
      [req.params.id, grossisteId]
    )
    if (!venteResult.rows.length) return res.status(404).json({ message: 'Vente introuvable' })

    const lignesResult = await pool.query(
      `SELECT lv.*, p.nom AS produit_nom
       FROM lignes_vente lv
       JOIN produits p ON p.id = lv.produit_id
       WHERE lv.vente_id = $1`,
      [req.params.id]
    )

    const paiementsResult = await pool.query(
      'SELECT * FROM paiements WHERE vente_id = $1 ORDER BY date',
      [req.params.id]
    )

    res.json({
      ...venteResult.rows[0],
      lignes: lignesResult.rows,
      paiements: paiementsResult.rows
    })
  } catch (err) {
    next(err)
  }
}

export async function createVente (req, res, next) {
  const client = await pool.connect()
  try {
    const grossisteId = getGrossisteId(req)
    if (!grossisteId || !(await assertGrossisteAccess(req, grossisteId))) {
      return res.status(403).json({ message: 'Accès refusé' })
    }

    const { client_id, lignes, remise = 0, tva = 0, paiements = [] } = req.body

    if (!lignes?.length) {
      return res.status(400).json({ message: 'Le panier est vide' })
    }

    await client.query('BEGIN')

    let montant = 0
    for (const ligne of lignes) {
      montant += parseFloat(ligne.prix) * parseInt(ligne.quantite, 10)
    }

    const total = montant - parseFloat(remise) + parseFloat(tva)
    const paye = paiements.reduce((s, p) => s + parseFloat(p.montant), 0)
    const reste = total - paye
    const numero = await generateNumero(client, grossisteId)
    const utilisateurId = req.user.role === 'employe' ? req.user.id : null

    const venteResult = await client.query(
      `INSERT INTO ventes (grossiste_id, client_id, utilisateur_id, numero, montant, remise, tva, total, paye, reste)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [grossisteId, client_id, utilisateurId, numero, montant, remise, tva, total, paye, reste]
    )

    const vente = venteResult.rows[0]

    for (const ligne of lignes) {
      const ligneTotal = parseFloat(ligne.prix) * parseInt(ligne.quantite, 10)

      await client.query(
        `INSERT INTO lignes_vente (vente_id, produit_id, prix, quantite, total)
         VALUES ($1, $2, $3, $4, $5)`,
        [vente.id, ligne.produit_id, ligne.prix, ligne.quantite, ligneTotal]
      )

      const produitResult = await client.query(
        'SELECT stock FROM produits WHERE id = $1 AND grossiste_id = $2 FOR UPDATE',
        [ligne.produit_id, grossisteId]
      )
      if (!produitResult.rows.length) throw new Error('Produit introuvable')

      const newStock = parseInt(produitResult.rows[0].stock, 10) - parseInt(ligne.quantite, 10)
      if (newStock < 0) throw Object.assign(new Error('Stock insuffisant'), { status: 400 })

      await client.query('UPDATE produits SET stock = $1 WHERE id = $2', [newStock, ligne.produit_id])

      await client.query(
        `INSERT INTO mouvements_stock (grossiste_id, produit_id, type, quantite, motif, utilisateur_id)
         VALUES ($1, $2, 'sortie', $3, $4, $5)`,
        [grossisteId, ligne.produit_id, ligne.quantite, `Vente ${numero}`, utilisateurId]
      )
    }

    for (const paiement of paiements) {
      await client.query(
        `INSERT INTO paiements (vente_id, mode, montant, reference)
         VALUES ($1, $2, $3, $4)`,
        [vente.id, paiement.mode, paiement.montant, paiement.reference]
      )
    }

    await client.query('COMMIT')
    res.status(201).json(vente)
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
}
