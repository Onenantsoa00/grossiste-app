<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Tableau de bord global</div>

    <div v-if="dashboard.loading" class="flex flex-center q-pa-xl">
      <q-spinner color="primary" size="3em" />
    </div>

    <template v-else-if="dashboard.bossStats">
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-sm-6 col-md-4 col-lg-2" v-for="stat in globalStats" :key="stat.label">
          <q-card class="stat-card q-pa-md">
            <div class="text-grey-7 text-caption">{{ stat.label }}</div>
            <div class="text-h6 text-primary">{{ stat.value }}</div>
          </q-card>
        </div>
      </div>

      <div class="text-h6 q-mb-md">Vos grossistes</div>
      <div class="row q-col-gutter-md">
        <div
          class="col-12 col-md-6 col-lg-4"
          v-for="g in dashboard.bossGrossistes"
          :key="g.id"
        >
          <q-card class="grossiste-card q-pa-md">
            <div class="row items-center q-mb-sm">
              <q-avatar v-if="g.logo" size="48px">
                <img :src="g.logo" :alt="g.nom">
              </q-avatar>
              <q-avatar v-else color="primary" text-color="white" icon="store" size="48px" />
              <div class="q-ml-md">
                <div class="text-h6">{{ g.nom }}</div>
                <q-badge :color="g.actif ? 'positive' : 'negative'" :label="g.actif ? 'Actif' : 'Inactif'" />
              </div>
            </div>
            <q-separator class="q-my-sm" />
            <div class="row q-col-gutter-sm text-body2">
              <div class="col-6">CA : {{ formatMontant(g.chiffre_affaires) }}</div>
              <div class="col-6">Produits : {{ g.nb_produits }}</div>
              <div class="col-6">Clients : {{ g.nb_clients }}</div>
              <div class="col-6">Employés : {{ g.nb_employes }}</div>
              <div class="col-12 text-negative" v-if="g.stock_faible > 0">
                Stock faible : {{ g.stock_faible }}
              </div>
            </div>
            <q-btn
              class="full-width q-mt-md"
              color="primary"
              label="Ouvrir le grossiste"
              icon="open_in_new"
              :disable="!g.actif"
              @click="openGrossiste(g)"
            />
          </q-card>
        </div>
      </div>

      <div v-if="!dashboard.bossGrossistes.length" class="text-center q-pa-xl text-grey-6">
        Aucun grossiste. <router-link to="/boss/grossistes">Créer votre premier grossiste</router-link>
      </div>
    </template>
  </q-page>
</template>

<script>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboardStore, formatMontant } from 'stores/dashboard'
import { useAuthStore } from 'stores/auth'

export default {
  name: 'BossDashboardPage',
  setup () {
    const dashboard = useDashboardStore()
    const auth = useAuthStore()
    const router = useRouter()

    onMounted(() => dashboard.fetchBossDashboard())

    const globalStats = computed(() => {
      const s = dashboard.bossStats || {}
      return [
        { label: 'Grossistes', value: s.nb_grossistes ?? 0 },
        { label: 'Produits', value: s.nb_produits ?? 0 },
        { label: 'Ventes', value: s.nb_ventes ?? 0 },
        { label: 'Chiffre d\'affaires', value: formatMontant(s.chiffre_affaires) },
        { label: 'Employés', value: s.nb_employes ?? 0 },
        { label: 'Stock global', value: s.stock_global ?? 0 }
      ]
    })

    function openGrossiste (grossiste) {
      auth.enterGrossiste(grossiste)
      router.push('/grossiste')
    }

    return { dashboard, globalStats, formatMontant, openGrossiste }
  }
}
</script>
