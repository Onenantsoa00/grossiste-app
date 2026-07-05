export function errorHandler (err, req, res, next) {
  console.error(err)

  if (err.code === '23505') {
    return res.status(409).json({ message: 'Cette valeur existe déjà' })
  }

  if (err.code === '23503') {
    return res.status(400).json({ message: 'Référence invalide' })
  }

  res.status(err.status || 500).json({
    message: err.message || 'Erreur serveur interne'
  })
}
