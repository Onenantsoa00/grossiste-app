import { Router } from "express";
import { authenticate, requireBoss } from "../middleware/auth.js";
import * as subscriptionController from "../controllers/subscriptionController.js";

const router = Router();

router.post(
  "/subscriptions/:bossId/renew",
  authenticate,
  requireBoss,
  subscriptionController.renewSubscription,
);

export default router;
