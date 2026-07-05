import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { errorHandler } from './middleware/errorHandler.js'

import authRoutes from './routes/auth.js'
import dashboardRoutes from './routes/dashboard.js'
import grossisteRoutes from './routes/grossistes.js'
import employeRoutes from './routes/employes.js'
import produitRoutes from './routes/produits.js'
import clientRoutes from './routes/clients.js'
import fournisseurRoutes from './routes/fournisseurs.js'
import stockRoutes from './routes/stock.js'
import venteRoutes from './routes/ventes.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:9000',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API Gestion Grossiste' })
})

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/grossistes', grossisteRoutes)
app.use('/api/employes', employeRoutes)
app.use('/api/produits', produitRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/fournisseurs', fournisseurRoutes)
app.use('/api/stock', stockRoutes)
app.use('/api/ventes', venteRoutes)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`)
})
