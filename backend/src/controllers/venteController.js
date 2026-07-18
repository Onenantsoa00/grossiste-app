import pool from "../config/db.js";
import { stockDeduction } from "../utils/stockConversion.js";

function parseQuantite(value, uniteVente = "piece") {
  const q = parseFloat(value);
  if (!Number.isFinite(q) || q <= 0) return null;
  if (uniteVente === "piece" && !Number.isInteger(q)) return null;
  return uniteVente === "kg" ? Math.round(q * 1000) / 1000 : q;
}

function parseVenteQuantite(value, typePrix, uniteVente = "piece") {
  const q = parseFloat(value);
  if (!Number.isFinite(q) || q <= 0) return null;
  if (typePrix === "carton" || typePrix === "sac") {
    if (!Number.isInteger(q)) return null;
    return q;
  }
  return parseQuantite(value, uniteVente);
}

async function assertGrossisteAccess(req, grossisteId) {
  if (req.user.role === "employe") {
    return req.user.grossiste_id === grossisteId;
  }
  const { rows } = await pool.query(
    "SELECT id FROM grossistes WHERE id = $1 AND boss_id = $2",
    [grossisteId, req.user.id],
  );
  return rows.length > 0;
}

function getGrossisteId(req) {
  return req.grossisteId || req.user.grossiste_id || req.body.grossiste_id;
}

async function generateNumero(client, grossisteId) {
  const countResult = await client.query(
    "SELECT COUNT(*)::int AS c FROM ventes WHERE grossiste_id = $1",
    [grossisteId],
  );
  const seq = countResult.rows[0].c + 1;
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `V-${date}-${String(seq).padStart(4, "0")}`;
}

async function generateRecu(client, grossisteId) {
  const countResult = await client.query(
    "SELECT COUNT(*)::int AS c FROM ventes WHERE grossiste_id = $1",
    [grossisteId],
  );
  const seq = countResult.rows[0].c + 1;
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `REC-${date}-${String(seq).padStart(4, "0")}`;
}

export async function listVentes(req, res, next) {
  try {
    const grossisteId = getGrossisteId(req);
    if (!grossisteId || !(await assertGrossisteAccess(req, grossisteId))) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const { recu } = req.query;
    const conditions = ["v.grossiste_id = $1", "v.deleted = false"];
    const params = [grossisteId];

    if (recu?.trim()) {
      conditions.push(`(v.recu ILIKE $2 OR v.numero ILIKE $2)`);
      params.push(`%${recu.trim()}%`);
    }

    const { rows } = await pool.query(
      `SELECT v.*, c.nom AS client_nom,
              COALESCE(v.recu, v.numero) AS recu
       FROM ventes v
       LEFT JOIN clients c ON c.id = v.client_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY v.date DESC`,
      params,
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function getVente(req, res, next) {
  try {
    const grossisteId = getGrossisteId(req);
    if (!grossisteId || !(await assertGrossisteAccess(req, grossisteId))) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const venteResult = await pool.query(
      `SELECT v.*, c.nom AS client_nom, c.telephone AS client_telephone
       FROM ventes v
       LEFT JOIN clients c ON c.id = v.client_id
       WHERE v.id = $1 AND v.grossiste_id = $2 AND v.deleted = false`,
      [req.params.id, grossisteId],
    );
    if (!venteResult.rows.length)
      return res.status(404).json({ message: "Vente introuvable" });

    const lignesResult = await pool.query(
      `SELECT lv.*, p.nom AS produit_nom, p.unite_vente
       FROM lignes_vente lv
       JOIN produits p ON p.id = lv.produit_id
       WHERE lv.vente_id = $1`,
      [req.params.id],
    );

    const paiementsResult = await pool.query(
      "SELECT * FROM paiements WHERE vente_id = $1 ORDER BY date",
      [req.params.id],
    );

    res.json({
      ...venteResult.rows[0],
      lignes: lignesResult.rows,
      paiements: paiementsResult.rows,
    });
  } catch (err) {
    next(err);
  }
}

export async function exportVentes(req, res, next) {
  try {
    const grossisteId = getGrossisteId(req);
    if (!grossisteId || !(await assertGrossisteAccess(req, grossisteId))) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const ventesResult = await pool.query(
      `SELECT v.*, c.nom AS client_nom
       FROM ventes v
       LEFT JOIN clients c ON c.id = v.client_id
       WHERE v.grossiste_id = $1 AND v.deleted = false
       ORDER BY v.date DESC`,
      [grossisteId],
    );

    const venteIds = ventesResult.rows.map((v) => v.id);
    let lignesByVente = {};
    let paiementsByVente = {};

    if (venteIds.length) {
      const lignesResult = await pool.query(
        `SELECT lv.*, p.nom AS produit_nom, p.unite_vente
         FROM lignes_vente lv
         JOIN produits p ON p.id = lv.produit_id
         WHERE lv.vente_id = ANY($1)
         ORDER BY lv.id`,
        [venteIds],
      );
      lignesByVente = lignesResult.rows.reduce((acc, ligne) => {
        acc[ligne.vente_id] = acc[ligne.vente_id] || [];
        acc[ligne.vente_id].push(ligne);
        return acc;
      }, {});

      const paiementsResult = await pool.query(
        `SELECT * FROM paiements WHERE vente_id = ANY($1) ORDER BY date`,
        [venteIds],
      );
      paiementsByVente = paiementsResult.rows.reduce((acc, paiement) => {
        acc[paiement.vente_id] = acc[paiement.vente_id] || [];
        acc[paiement.vente_id].push(paiement);
        return acc;
      }, {});
    }

    res.json(
      ventesResult.rows.map((vente) => ({
        ...vente,
        lignes: lignesByVente[vente.id] || [],
        paiements: paiementsByVente[vente.id] || [],
      })),
    );
  } catch (err) {
    next(err);
  }
}

export async function deleteAllVentes(req, res, next) {
  const client = await pool.connect();
  try {
    const grossisteId = getGrossisteId(req);
    if (!grossisteId || !(await assertGrossisteAccess(req, grossisteId))) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    await client.query("BEGIN");
    await client.query(
      `UPDATE ventes SET deleted = true WHERE grossiste_id = $1`,
      [grossisteId],
    );
    await client.query("COMMIT");
    res.json({ message: "Toutes les ventes ont été supprimées" });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
}

export async function createVente(req, res, next) {
  const client = await pool.connect();
  try {
    const grossisteId = getGrossisteId(req);
    if (!grossisteId || !(await assertGrossisteAccess(req, grossisteId))) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const { client_id, lignes, remise = 0, tva = 0, paiements = [] } = req.body;

    if (!lignes?.length) {
      return res.status(400).json({ message: "Le panier est vide" });
    }

    // Validate and normalize lignes
    const produitIds = lignes.map((l) => l.produit_id);
    const produitsResult = await pool.query(
      `SELECT id, stock, unite_vente, nom, qte_par_carton, qte_par_sac FROM produits
       WHERE id = ANY($1::uuid[]) AND grossiste_id = $2`,
      [produitIds, grossisteId],
    );
    const produitsMap = Object.fromEntries(
      produitsResult.rows.map((p) => [p.id, p]),
    );

    const deductionsParProduit = {};

    for (const [idx, ligne] of lignes.entries()) {
      if (
        ligne == null ||
        ligne.produit_id === undefined ||
        ligne.produit_id === null
      ) {
        return res
          .status(400)
          .json({ message: `Ligne ${idx + 1} : produit_id manquant` });
      }

      const produit = produitsMap[ligne.produit_id];
      if (!produit) {
        return res
          .status(400)
          .json({ message: `Ligne ${idx + 1} : produit introuvable` });
      }

      const VALID_TYPES = ["unitaire", "grossiste", "carton", "sac"];
      const typePrix = VALID_TYPES.includes(ligne.type_prix)
        ? ligne.type_prix
        : "unitaire";

      if (
        typePrix === "carton" &&
        parseFloat(produit.qte_par_carton || 0) <= 0
      ) {
        return res.status(400).json({
          message: `Ligne ${idx + 1} : définissez la quantité par carton pour « ${produit.nom} »`,
        });
      }
      if (typePrix === "sac" && parseFloat(produit.qte_par_sac || 0) <= 0) {
        return res.status(400).json({
          message: `Ligne ${idx + 1} : définissez la quantité par sac (kg) pour « ${produit.nom} »`,
        });
      }

      const prix = parseFloat(ligne.prix);
      const quantite = parseVenteQuantite(
        ligne.quantite,
        typePrix,
        produit.unite_vente || "piece",
      );

      if (!Number.isFinite(prix) || prix < 0 || quantite == null) {
        const msg =
          typePrix === "carton" || typePrix === "sac"
            ? `Ligne ${idx + 1} : prix ou nombre de ${typePrix}s invalide (entier > 0)`
            : produit.unite_vente === "kg"
              ? `Ligne ${idx + 1} : prix ou quantité invalide (kg > 0)`
              : `Ligne ${idx + 1} : prix ou quantité invalide (nombre entier > 0)`;
        return res.status(400).json({ message: msg });
      }

      const ded = stockDeduction(quantite, typePrix, produit);
      deductionsParProduit[ligne.produit_id] =
        (deductionsParProduit[ligne.produit_id] || 0) + ded;

      ligne.prix = prix;
      ligne.quantite = quantite;
      ligne.type_prix = typePrix;
      ligne._deduction = ded;
    }

    for (const [produitId, totalDed] of Object.entries(deductionsParProduit)) {
      const produit = produitsMap[produitId];
      if (parseFloat(produit.stock) < totalDed) {
        return res.status(400).json({
          message: `Stock insuffisant pour « ${produit.nom} » (disponible : ${produit.stock}, requis : ${totalDed})`,
        });
      }
    }

    await client.query("BEGIN");

    let montant = 0;
    for (const ligne of lignes) {
      montant += ligne.prix * ligne.quantite;
    }

    const total = montant - parseFloat(remise) + parseFloat(tva);
    const paye = paiements.reduce((s, p) => s + parseFloat(p.montant), 0);
    const reste = total - paye;
    const numero = await generateNumero(client, grossisteId);
    const recu = await generateRecu(client, grossisteId);
    const utilisateurId = req.user.role === "employe" ? req.user.id : null;

    const venteResult = await client.query(
      `INSERT INTO ventes (grossiste_id, client_id, utilisateur_id, numero, recu, montant, remise, tva, total, paye, reste)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        grossisteId,
        client_id,
        utilisateurId,
        numero,
        recu,
        montant,
        remise,
        tva,
        total,
        paye,
        reste,
      ],
    );

    const vente = venteResult.rows[0];

    for (const ligne of lignes) {
      const ligneTotal =
        Math.round(parseFloat(ligne.prix) * parseFloat(ligne.quantite) * 100) /
        100;

      const typePrix = ligne.type_prix;
      const ded = ligne._deduction;

      await client.query(
        `INSERT INTO lignes_vente (vente_id, produit_id, prix, quantite, total, type_prix)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          vente.id,
          ligne.produit_id,
          ligne.prix,
          ligne.quantite,
          ligneTotal,
          typePrix,
        ],
      );

      const produitResult = await client.query(
        "SELECT stock FROM produits WHERE id = $1 AND grossiste_id = $2 FOR UPDATE",
        [ligne.produit_id, grossisteId],
      );
      if (!produitResult.rows.length) throw new Error("Produit introuvable");

      const currentStock = parseFloat(produitResult.rows[0].stock);
      const newStock = Math.round((currentStock - ded) * 1000) / 1000;
      if (newStock < 0)
        throw Object.assign(new Error("Stock insuffisant"), { status: 400 });

      await client.query("UPDATE produits SET stock = $1 WHERE id = $2", [
        newStock,
        ligne.produit_id,
      ]);

      await client.query(
        `INSERT INTO mouvements_stock (grossiste_id, produit_id, type, quantite, motif, utilisateur_id)
         VALUES ($1, $2, 'sortie', $3, $4, $5)`,
        [
          grossisteId,
          ligne.produit_id,
          ded,
          `Vente ${numero} (${ligne.quantite} ${typePrix})`,
          utilisateurId,
        ],
      );
    }

    for (const paiement of paiements) {
      await client.query(
        `INSERT INTO paiements (vente_id, mode, montant, reference)
         VALUES ($1, $2, $3, $4)`,
        [vente.id, paiement.mode, paiement.montant, paiement.reference],
      );
    }

    await client.query("COMMIT");
    res.status(201).json(vente);
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
}
