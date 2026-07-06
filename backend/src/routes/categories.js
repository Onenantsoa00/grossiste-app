import { Router } from 'express'
import * as categorie from '../controllers/categorieController.js'
import { authenticate, resolveGrossisteContext } from '../middleware/auth.js'

const router = Router()

router.use(authenticate, resolveGrossisteContext)

router.get('/', categorie.listCategories)
router.post('/', categorie.createCategorie)
router.put('/:id', categorie.updateCategorie)
router.delete('/:id', categorie.deleteCategorie)

export default router
