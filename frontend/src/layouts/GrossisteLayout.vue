<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="app-header">
      <q-toolbar>
        <q-btn
          v-if="auth.isBoss"
          flat
          icon="arrow_back"
          :label="$q.screen.gt.xs ? 'Retour Boss' : undefined"
          @click="goBackBoss"
        />
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
        <q-toolbar-title>
          {{ auth.activeGrossiste?.nom || "Grossiste" }}
        </q-toolbar-title>
        <q-btn
          flat
          icon="logout"
          :label="$q.screen.gt.xs ? 'Déconnexion' : undefined"
          @click="onLogout"
        />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="app-drawer"
    >
      <q-list>
        <q-item clickable v-ripple to="/grossiste" exact>
          <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
          <q-item-section>Tableau de bord</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/grossiste/produits">
          <q-item-section avatar><q-icon name="inventory_2" /></q-item-section>
          <q-item-section>Produits</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/grossiste/clients">
          <q-item-section avatar><q-icon name="people" /></q-item-section>
          <q-item-section>Clients</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/grossiste/fournisseurs">
          <q-item-section avatar
            ><q-icon name="local_shipping"
          /></q-item-section>
          <q-item-section>Fournisseurs</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/grossiste/stock">
          <q-item-section avatar><q-icon name="warehouse" /></q-item-section>
          <q-item-section>Stock</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/grossiste/ventes">
          <q-item-section avatar
            ><q-icon name="point_of_sale"
          /></q-item-section>
          <q-item-section>Ventes</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <q-banner
        v-if="auth.subscriptionWarning"
        dense
        class="bg-negative text-white"
      >
        Votre abonnement est expiré depuis
        {{ auth.subscriptionDaysLate }} jour(s). Veuillez effectuer votre
        paiement rapidement.
      </q-banner>
      <router-view />
    </q-page-container>
    <subscription-footer />
  </q-layout>
</template>

<script>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "stores/auth";
import SubscriptionFooter from "components/SubscriptionFooter.vue";

export default {
  name: "GrossisteLayout",
  components: { SubscriptionFooter },
  setup() {
    const leftDrawerOpen = ref(false);
    const auth = useAuthStore();
    const router = useRouter();

    function toggleLeftDrawer() {
      leftDrawerOpen.value = !leftDrawerOpen.value;
    }

    function goBackBoss() {
      auth.leaveGrossiste();
      router.push("/boss");
    }

    function onLogout() {
      auth.logout();
      router.push("/login");
    }

    return { leftDrawerOpen, toggleLeftDrawer, auth, goBackBoss, onLogout };
  },
};
</script>
