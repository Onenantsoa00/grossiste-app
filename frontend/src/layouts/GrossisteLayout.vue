<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-indigo-8">
      <q-toolbar>
        <q-btn v-if="auth.isBoss" flat icon="arrow_back" :label="$q.screen.gt.xs ? 'Retour Boss' : undefined" @click="goBackBoss" />
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <q-toolbar-title>
          {{ auth.activeGrossiste?.nom || 'Grossiste' }}
        </q-toolbar-title>
        <q-btn flat icon="logout" :label="$q.screen.gt.xs ? 'Déconnexion' : undefined" @click="onLogout" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
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
          <q-item-section avatar><q-icon name="local_shipping" /></q-item-section>
          <q-item-section>Fournisseurs</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/grossiste/stock">
          <q-item-section avatar><q-icon name="warehouse" /></q-item-section>
          <q-item-section>Stock</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/grossiste/ventes">
          <q-item-section avatar><q-icon name="point_of_sale" /></q-item-section>
          <q-item-section>Ventes</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'

export default {
  name: 'GrossisteLayout',
  setup () {
    const leftDrawerOpen = ref(false)
    const auth = useAuthStore()
    const router = useRouter()

    function toggleLeftDrawer () {
      leftDrawerOpen.value = !leftDrawerOpen.value
    }

    function goBackBoss () {
      auth.leaveGrossiste()
      router.push('/boss')
    }

    function onLogout () {
      auth.logout()
      router.push('/login')
    }

    return { leftDrawerOpen, toggleLeftDrawer, auth, goBackBoss, onLogout }
  }
}
</script>
