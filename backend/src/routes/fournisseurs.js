import { Router } from 'express'
import * as fournisseur from '../controllers/fournisseurController.js'
import { authenticate, resolveGrossisteContext } from '../middleware/auth.js'

const router = Router()

router.use(authenticate, resolveGrossisteContext)

router.get('/', fournisseur.listFournisseurs)
router.post('/', fournisseur.createFournisseur)
router.put('/:id', fournisseur.updateFournisseur)
router.delete('/:id', fournisseur.deleteFournisseur)

export default router
