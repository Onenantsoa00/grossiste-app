import { Router } from 'express'
import * as auth from '../controllers/authController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/register', auth.registerBoss)
router.post('/login', auth.login)
router.post('/forgot-password', auth.forgotPassword)
router.post('/reset-password', auth.resetPassword)
router.get('/me', authenticate, auth.me)

export default router
