import { Router } from 'express'
import * as grossiste from '../controllers/grossisteController.js'
import { authenticate, requireBoss } from '../middleware/auth.js'

const router = Router()

router.use(authenticate, requireBoss)

router.get('/', grossiste.listGrossistes)
router.get('/:id', grossiste.getGrossiste)
router.post('/', grossiste.createGrossiste)
router.put('/:id', grossiste.updateGrossiste)
router.patch('/:id/toggle', grossiste.toggleGrossiste)
router.delete('/:id', grossiste.deleteGrossiste)

export default router
