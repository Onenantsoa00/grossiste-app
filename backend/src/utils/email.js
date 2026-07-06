/**
 * Envoi d'email optionnel pour la réinitialisation du mot de passe.
 * Si SMTP n'est pas configuré, retourne false (le lien sera fourni autrement).
 */
export async function sendPasswordResetEmail (email, resetUrl) {
  const host = process.env.SMTP_HOST
  if (!host) return false

  try {
    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.default.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined
    })

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@grossiste.local',
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <p>Bonjour,</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p><a href="${resetUrl}">Cliquez ici pour définir un nouveau mot de passe</a></p>
        <p>Ce lien expire dans 1 heure.</p>
        <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      `
    })
    return true
  } catch (err) {
    console.error('Erreur envoi email:', err.message)
    return false
  }
}

export function buildResetUrl (token) {
  const base = (process.env.FRONTEND_URL || 'http://localhost:9000').replace(/\/$/, '')
  return `${base}/reset-password?token=${token}`
}
