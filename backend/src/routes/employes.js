import { Router } from 'express'
import * as employe from '../controllers/employeController.js'
import { authenticate, requireBoss } from '../middleware/auth.js'

const router = Router()

router.use(authenticate, requireBoss)

router.get('/', employe.listEmployes)
router.post('/', employe.createEmploye)
router.put('/:id', employe.updateEmploye)
router.patch('/:id/reset-password', employe.resetEmployePassword)
router.delete('/:id', employe.deleteEmploye)

export default router
