<template>
  <div class="subscription-guard q-pa-xl flex flex-center">
    <q-card class="subscription-card q-pa-md" flat bordered>
      <q-card-section>
        <div class="text-h5 q-mb-md">Votre abonnement est expiré</div>
        <div class="q-mb-md">Veuillez effectuer votre paiement.</div>
        <div class="q-mb-md">
          <strong>MVola :</strong> 0375441549<br />
          <strong>Orange Money :</strong> 0389145273<br />
          <strong>Nom :</strong> Ranaivo Andry Ny Avo Onenantsoa
        </div>
        <div class="q-mb-md">
          Après réception de votre paiement, l'administrateur réactivera votre
          compte.
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          color="primary"
          label="J'ai effectué mon paiement"
          @click="onPaymentClicked"
        />
      </q-card-actions>

      <q-card-section
        v-if="paymentMessage"
        class="text-primary q-pa-none q-mt-md"
      >
        {{ paymentMessage }}
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref } from "vue";

const paymentMessage = ref("");

function onPaymentClicked() {
  paymentMessage.value =
    "Merci. Votre paiement sera vérifié dans les plus brefs délais.";
}
</script>

<style scoped>
.subscription-guard {
  min-height: 100vh;
}
.subscription-card {
  width: min(100%, 520px);
}
</style>
