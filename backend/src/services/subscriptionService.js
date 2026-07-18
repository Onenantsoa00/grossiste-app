import * as subscriptionRepo from "../repositories/subscriptionRepository.js";

function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export async function getBossSubscription(bossId) {
  return subscriptionRepo.findLatestByBossId(bossId);
}

export async function renewBossSubscription(bossId, options) {
  const { months, montant, modePaiement, reference, commentaire, validatedBy } =
    options;
  const existing = await subscriptionRepo.findLatestByBossId(bossId);
  const now = new Date();

  const baseDate =
    existing?.date_expiration && new Date(existing.date_expiration) > now
      ? new Date(existing.date_expiration)
      : now;

  const expirationDate = addMonths(baseDate, months);
  const plan = existing?.plan || "standard";
  let subscription = existing;

  if (existing) {
    subscription = await subscriptionRepo.updateSubscriptionExpiration(
      existing.id,
      expirationDate,
      "active",
    );
  } else {
    subscription = await subscriptionRepo.createSubscription({
      bossId,
      plan,
      dateDebut: now,
      dateExpiration: expirationDate,
      statut: "active",
      joursGrave: 2,
    });
  }

  const payment = await subscriptionRepo.createPayment({
    subscriptionId: subscription.id,
    montant,
    modePaiement,
    reference,
    commentaire,
    validePar: validatedBy,
    datePaiement: now,
  });

  return { subscription, payment };
}
