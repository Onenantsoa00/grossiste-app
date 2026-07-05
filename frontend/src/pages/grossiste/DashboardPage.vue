<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Tableau de bord — {{ dashboard.grossisteData?.grossiste?.nom }}</div>

    <div v-if="dashboard.loading" class="flex flex-center q-pa-xl">
      <q-spinner color="primary" size="3em" />
    </div>

    <div v-else-if="dashboard.grossisteData" class="row q-col-gutter-md">
      <div class="col-12 col-sm-6 col-md-4 col-lg-3" v-for="stat in stats" :key="stat.label">
        <q-card class="stat-card q-pa-md">
          <div class="text-grey-7 text-caption">{{ stat.label }}</div>
          <div class="text-h6 text-primary">{{ stat.value }}</div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
import { computed, onMounted } from 'vue'
import { useDashboardStore, formatMontant } from 'stores/dashboard'
import { useAuthStore } from 'stores/auth'

export default {
  name: 'GrossisteDashboardPage',
  setup () {
    const dashboard = useDashboardStore()
    const auth = useAuthStore()

    onMounted(() => {
      const id = auth.activeGrossisteId
      if (id) dashboard.fetchGrossisteDashboard(id)
    })

    const stats = computed(() => {
      const s = dashboard.grossisteData?.stats || {}
      return [
        { label: 'Produits', value: s.nb_produits ?? 0 },
        { label: 'Clients', value: s.nb_clients ?? 0 },
        { label: 'Fournisseurs', value: s.nb_fournisseurs ?? 0 },
        { label: 'Employés', value: s.nb_employes ?? 0 },
        { label: 'Ventes', value: s.nb_ventes ?? 0 },
        { label: 'CA', value: formatMontant(s.chiffre_affaires) },
        { label: 'Stock', value: s.stock_total ?? 0 },
        { label: 'Stock faible', value: s.stock_faible ?? 0 }
      ]
    })

    return { dashboard, stats }
  }
}
</script>
