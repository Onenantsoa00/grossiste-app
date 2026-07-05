import { Router } from 'express'
import * as client from '../controllers/clientController.js'
import { authenticate, resolveGrossisteContext } from '../middleware/auth.js'

const router = Router()

router.use(authenticate, resolveGrossisteContext)

router.get('/', client.listClients)
router.post('/', client.createClient)
router.put('/:id', client.updateClient)
router.delete('/:id', client.deleteClient)

export default router
