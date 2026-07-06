/**
 * Convertit une quantité vendue (cartons, sacs, unités) en quantité de stock à déduire.
 */
export function stockDeduction (quantite, typePrix, produit) {
  const q = parseFloat(quantite)
  if (!Number.isFinite(q) || q <= 0) return 0

  if (typePrix === 'carton') {
    const parCarton = parseFloat(produit.qte_par_carton || 0)
    if (parCarton > 0) return Math.round(q * parCarton * 1000) / 1000
  }
  if (typePrix === 'sac') {
    const parSac = parseFloat(produit.qte_par_sac || 0)
    if (parSac > 0) return Math.round(q * parSac * 1000) / 1000
  }
  return produit.unite_vente === 'kg'
    ? Math.round(q * 1000) / 1000
    : q
}

export function maxVendable (stock, typePrix, produit) {
  const s = parseFloat(stock || 0)
  if (typePrix === 'carton') {
    const parCarton = parseFloat(produit.qte_par_carton || 0)
    if (parCarton > 0) return Math.floor(s / parCarton)
    return 0
  }
  if (typePrix === 'sac') {
    const parSac = parseFloat(produit.qte_par_sac || 0)
    if (parSac > 0) return Math.floor((s / parSac) * 1000) / 1000
    return 0
  }
  return s
}

export function labelVenteType (typePrix) {
  const labels = {
    unitaire: 'unité(s)',
    grossiste: 'unité(s) grossiste',
    carton: 'carton(s)',
    sac: 'sac(s)'
  }
  return labels[typePrix] || 'unité(s)'
}

export function conversionHint (produit) {
  const hints = []
  if (parseFloat(produit.qte_par_carton) > 0) {
    hints.push(`1 carton = ${produit.qte_par_carton} pièce(s)`)
  }
  if (parseFloat(produit.qte_par_sac) > 0) {
    hints.push(`1 sac = ${produit.qte_par_sac} kg`)
  }
  return hints.join(' — ')
}
