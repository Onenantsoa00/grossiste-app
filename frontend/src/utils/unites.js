export const UNITE_OPTIONS = [
  { label: 'À l\'unité (nombre)', value: 'piece' },
  { label: 'Au kilo (kg)', value: 'kg' }
]

export function isKg (unite) {
  return unite === 'kg'
}

export function uniteLabel (unite) {
  return isKg(unite) ? 'kg' : 'unité'
}

export function unitePrixSuffix (unite) {
  return isKg(unite) ? '/kg' : '/unité'
}

export function formatQuantite (value, unite) {
  const num = parseFloat(value || 0)
  if (isKg(unite)) {
    return num % 1 === 0 ? String(num) : num.toFixed(3).replace(/\.?0+$/, '')
  }
  return String(Math.round(num))
}

export function parseQuantiteInput (value, unite) {
  const q = parseFloat(value)
  if (!Number.isFinite(q) || q <= 0) return null
  if (!isKg(unite) && !Number.isInteger(q)) return null
  return isKg(unite) ? Math.round(q * 1000) / 1000 : q
}

export function qtyStep (unite) {
  return isKg(unite) ? 0.001 : 1
}

export function qtyMin (unite) {
  return isKg(unite) ? 0.001 : 1
}

export function defaultQty (unite) {
  return isKg(unite) ? 0.5 : 1
}
