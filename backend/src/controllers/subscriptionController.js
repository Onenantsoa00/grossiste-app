import * as subscriptionService from "../services/subscriptionService.js";

export async function renewSubscription(req, res, next) {
  try {
    const bossId = req.params.bossId;

    if (req.user.id !== bossId) {
      return res.status(403).json({ message: "Opération non autorisée" });
    }

    const { months, montant, modePaiement, reference, commentaire } = req.body;

    if (!months || !montant || !modePaiement || !reference) {
      return res.status(400).json({
        message:
          "Les champs months, montant, modePaiement et reference sont requis",
      });
    }

    const parsedMonths = Number(months);
    const parsedMontant = Number(montant);

    if (!Number.isInteger(parsedMonths) || parsedMonths <= 0) {
      return res
        .status(400)
        .json({ message: "Le champ months doit être un entier positif" });
    }

    if (Number.isNaN(parsedMontant) || parsedMontant <= 0) {
      return res
        .status(400)
        .json({ message: "Le montant doit être un nombre positif" });
    }

    const { subscription, payment } =
      await subscriptionService.renewBossSubscription(bossId, {
        months: parsedMonths,
        montant: parsedMontant,
        modePaiement,
        reference,
        commentaire,
        validatedBy: req.user.id,
      });

    res.json({
      message: "Abonnement renouvelé avec succès",
      subscription,
      payment,
    });
  } catch (err) {
    next(err);
  }
}
