import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'gestion_grossiste',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
})

pool.on('error', (err) => {
  console.error('Erreur PostgreSQL inattendue:', err)
})

export default pool
