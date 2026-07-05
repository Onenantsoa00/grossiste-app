import { Router } from 'express'
import * as stock from '../controllers/stockController.js'
import { authenticate, resolveGrossisteContext } from '../middleware/auth.js'

const router = Router()

router.use(authenticate, resolveGrossisteContext)

router.get('/mouvements', stock.listMouvements)
router.get('/alertes', stock.getAlertes)
router.post('/mouvements', stock.createMouvement)

export default router
