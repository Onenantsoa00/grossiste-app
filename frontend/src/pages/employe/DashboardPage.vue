<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">{{ dashboard.employeData?.grossiste?.nom }}</div>

    <div v-if="dashboard.loading" class="flex flex-center q-pa-xl">
      <q-spinner color="primary" size="3em" />
    </div>

    <div v-else-if="dashboard.employeData" class="row q-col-gutter-md">
      <div class="col-12 col-sm-6 col-md-4" v-for="stat in stats" :key="stat.label">
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

export default {
  name: 'EmployeDashboardPage',
  setup () {
    const dashboard = useDashboardStore()

    onMounted(() => dashboard.fetchEmployeDashboard())

    const stats = computed(() => {
      const s = dashboard.employeData?.stats || {}
      return [
        { label: 'Produits', value: s.nb_produits ?? 0 },
        { label: 'Clients', value: s.nb_clients ?? 0 },
        { label: 'Ventes', value: s.nb_ventes ?? 0 },
        { label: 'Chiffre d\'affaires', value: formatMontant(s.chiffre_affaires) },
        { label: 'Stock total', value: s.stock_total ?? 0 },
        { label: 'Stock faible', value: s.stock_faible ?? 0 }
      ]
    })

    return { dashboard, stats }
  }
}
</script>
