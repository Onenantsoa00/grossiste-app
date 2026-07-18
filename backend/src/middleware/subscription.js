import pool from "../config/db.js";

export function attachSubscriptionStatus(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = function (body) {
    if (
      res.locals.subscriptionStatus &&
      typeof body === "object" &&
      body !== null &&
      !Array.isArray(body)
    ) {
      body = { ...body, ...res.locals.subscriptionStatus };
    }

    return originalJson(body);
  };

  next();
}

function formatDate(date) {
  if (!date) return null;
  return date.toISOString().split("T")[0];
}

export async function verifySubscription(req, res, next) {
  if (!req.user) {
    return next();
  }

  const bossId = req.user.role === "boss" ? req.user.id : req.user.boss_id;
  if (!bossId) {
    return next();
  }

  const { rows } = await pool.query(
    `SELECT id, boss_id, plan, date_debut, date_expiration, statut, jours_grace
     FROM subscriptions
     WHERE boss_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [bossId],
  );

  const subscription = rows[0];
  if (!subscription) {
    return res.status(403).json({
      subscriptionExpired: true,
      daysLate: null,
      expirationDate: null,
      message: "Votre abonnement est expiré.",
    });
  }

  const now = new Date();
  const expirationDate = new Date(subscription.date_expiration);
  const graceDays = subscription.jours_grace ?? 2;
  const isActive = subscription.statut === "active";

  // compute days late (0 if not late)
  const millisecondsLate = Math.max(0, now - expirationDate);
  const daysLate = Math.max(0, Math.floor(millisecondsLate / 86400000));

  // attach status for all responses when subscription exists
  res.locals.subscriptionStatus = {
    subscriptionWarning: expirationDate < now && daysLate <= graceDays,
    daysLate,
    expirationDate: formatDate(expirationDate),
  };

  // set headers for clients that prefer headers
  res.setHeader(
    "X-Subscription-Warning",
    res.locals.subscriptionStatus.subscriptionWarning ? "1" : "0",
  );
  res.setHeader("X-Days-Late", String(daysLate));
  res.setHeader("X-Expiration-Date", formatDate(expirationDate));

  // if subscription is active and not expired => allow
  if (expirationDate >= now && isActive) {
    return next();
  }

  // if expired but still within grace => allow with warning (already set)
  if (expirationDate < now && isActive && daysLate <= graceDays) {
    return next();
  }

  // otherwise block
  return res.status(403).json({
    subscriptionExpired: true,
    daysLate,
    expirationDate: formatDate(expirationDate),
    message: "Votre abonnement est expiré.",
  });
}
