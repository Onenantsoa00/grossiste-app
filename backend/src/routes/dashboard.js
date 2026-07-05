import { Router } from 'express'
import * as dashboard from '../controllers/dashboardController.js'
import {
  authenticate,
  requireBoss,
  requireEmploye,
  resolveGrossisteContext,
  requireGrossisteAccess
} from '../middleware/auth.js'

const router = Router()

router.get('/boss', authenticate, requireBoss, dashboard.getBossDashboard)
router.get('/employe', authenticate, requireEmploye, dashboard.getEmployeDashboard)
router.get(
  '/grossiste/:grossisteId',
  authenticate,
  resolveGrossisteContext,
  requireGrossisteAccess,
  dashboard.getGrossisteDashboard
)

export default router
