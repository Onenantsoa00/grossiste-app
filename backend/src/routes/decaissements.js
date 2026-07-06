import { Router } from 'express'
import * as decaissement from '../controllers/decaissementController.js'
import { authenticate, requireBoss } from '../middleware/auth.js'

const router = Router()

router.use(authenticate, requireBoss)

router.get('/', decaissement.listDecaissements)
router.get('/stats', decaissement.getDecaissementStats)
router.post('/', decaissement.createDecaissement)
router.delete('/:id', decaissement.deleteDecaissement)

export default router
