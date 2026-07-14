<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="app-header">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
        <q-toolbar-title>Gestion Grossiste — Boss</q-toolbar-title>
        <q-btn flat :label="userLabel" icon="account_circle" />
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
        <q-item-label header>Navigation</q-item-label>
        <q-item clickable v-ripple to="/boss" exact>
          <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
          <q-item-section>Tableau de bord</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/boss/grossistes">
          <q-item-section avatar><q-icon name="store" /></q-item-section>
          <q-item-section>Grossistes</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/boss/employes">
          <q-item-section avatar><q-icon name="people" /></q-item-section>
          <q-item-section>Employés</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/boss/decaissements">
          <q-item-section avatar><q-icon name="payments" /></q-item-section>
          <q-item-section>Décaissements</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "stores/auth";

export default {
  name: "BossLayout",
  setup() {
    const leftDrawerOpen = ref(false);
    const auth = useAuthStore();
    const router = useRouter();

    const userLabel = computed(() =>
      auth.user ? `${auth.user.prenom} ${auth.user.nom}` : "",
    );

    function toggleLeftDrawer() {
      leftDrawerOpen.value = !leftDrawerOpen.value;
    }

    function onLogout() {
      auth.logout();
      router.push("/login");
    }

    return { leftDrawerOpen, toggleLeftDrawer, userLabel, onLogout };
  },
};
</script>
