<template>
  <q-footer elevated :class="footerClass">
    <div class="row items-center q-pa-sm no-wrap text-body2">
      <div class="col">
        <div class="text-subtitle2 text-weight-medium">Abonnement</div>
        <div>
          Mobile Money : <strong>0375441549</strong> ou
          <strong>0389145273</strong>
        </div>
        <div>Nom : <strong>Ranaivo Andry Ny Avo Onenantsoa</strong></div>
      </div>
      <div class="col-auto text-right">
        <div v-if="auth.subscriptionWarning">
          Abonnement en retard :
          <strong>{{ auth.subscriptionDaysLate }} jour(s)</strong>
        </div>
        <div v-else>
          Expiration :
          <strong>{{ auth.subscriptionExpirationDate || "—" }}</strong>
        </div>
        <div class="text-caption">
          Payez votre abonnement en mobile money pour continuer.
        </div>
      </div>
    </div>
  </q-footer>
</template>

<script setup>
import { computed } from "vue";
import { useAuthStore } from "stores/auth";

const auth = useAuthStore();

const footerClass = computed(() =>
  auth.subscriptionWarning ? "bg-red text-white" : "bg-grey-2 text-black",
);
</script>
