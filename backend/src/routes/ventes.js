import { Router } from 'express'
import * as vente from '../controllers/venteController.js'
import { authenticate, resolveGrossisteContext } from '../middleware/auth.js'

const router = Router()

router.use(authenticate, resolveGrossisteContext)

router.get('/', vente.listVentes)
router.get('/:id', vente.getVente)
router.post('/', vente.createVente)

export default router
