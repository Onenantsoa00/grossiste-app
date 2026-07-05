<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-teal-8">
      <q-toolbar>
        <q-toolbar-title>
          {{ auth.user?.grossiste_nom || 'Mon grossiste' }}
        </q-toolbar-title>
        <q-btn flat :label="userLabel" icon="account_circle" />
        <q-btn flat icon="logout" label="Déconnexion" @click="onLogout" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item clickable v-ripple to="/employe" exact>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'

export default {
  name: 'EmployeLayout',
  setup () {
    const leftDrawerOpen = ref(false)
    const auth = useAuthStore()
    const router = useRouter()

    onMounted(() => {
      if (auth.user?.grossiste_id) {
        auth.enterGrossiste({
          id: auth.user.grossiste_id,
          nom: auth.user.grossiste_nom
        })
      }
    })

    const userLabel = computed(() =>
      auth.user ? `${auth.user.prenom} ${auth.user.nom}` : ''
    )

    function onLogout () {
      auth.logout()
      router.push('/login')
    }

    return { leftDrawerOpen, auth, userLabel, onLogout }
  }
}
</script>
