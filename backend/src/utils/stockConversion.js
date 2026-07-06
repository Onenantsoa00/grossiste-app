/**
 * Convertit une quantité vendue (cartons, sacs, unités) en quantité de stock à déduire.
 * Ex. 2 sacs × 50 kg/sac = 100 kg déduits du stock.
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
