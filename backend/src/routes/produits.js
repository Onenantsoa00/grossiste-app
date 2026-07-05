import { Router } from 'express'
import * as produit from '../controllers/produitController.js'
import {
  authenticate,
  resolveGrossisteContext
} from '../middleware/auth.js'

const router = Router()

router.use(authenticate, resolveGrossisteContext)

router.get('/', produit.listProduits)
router.post('/', produit.createProduit)
router.put('/:id', produit.updateProduit)
router.delete('/:id', produit.deleteProduit)

export default router
