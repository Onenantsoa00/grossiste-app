<template>
  <q-page class="q-pa-md page-responsive">
    <div class="text-h5 q-mb-md">Tableau de bord global</div>

    <div v-if="dashboard.loading" class="flex flex-center q-pa-xl">
      <q-spinner color="primary" size="3em" />
    </div>

    <template v-else-if="dashboard.bossStats">
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-sm-6 col-md-4 col-lg-3" v-for="stat in globalStats" :key="stat.label">
          <q-card class="stat-card q-pa-md">
            <div class="text-grey-7 text-caption">{{ stat.label }}</div>
            <div class="text-h6" :class="stat.color || 'text-primary'">{{ stat.value }}</div>
          </q-card>
        </div>
      </div>

      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-lg-7">
          <q-card class="stat-card q-pa-md">
            <div class="text-subtitle1 q-mb-md">Ventes par produit (top 10)</div>
            <VentesBarChart :data="dashboard.bossStats.ventes_par_produit || []" />
          </q-card>
        </div>
        <div class="col-12 col-lg-5">
          <div class="row q-col-gutter-md">
            <div class="col-12" v-if="dashboard.bossStats.produit_plus_vendu">
              <q-card class="stat-card q-pa-md bg-green-1">
                <div class="text-grey-8 text-caption">Produit le plus vendu</div>
                <div class="text-h6 text-positive">{{ dashboard.bossStats.produit_plus_vendu.nom }}</div>
                <div class="text-body2">{{ dashboard.bossStats.produit_plus_vendu.quantite_vendue }} vendu(s)</div>
              </q-card>
            </div>
            <div class="col-12" v-if="dashboard.bossStats.produit_moins_vendu">
              <q-card class="stat-card q-pa-md bg-orange-1">
                <div class="text-grey-8 text-caption">Produit difficile à vendre</div>
                <div class="text-h6 text-orange-10">{{ dashboard.bossStats.produit_moins_vendu.nom }}</div>
                <div class="text-body2">{{ dashboard.bossStats.produit_moins_vendu.quantite_vendue }} vendu(s)</div>
              </q-card>
            </div>
          </div>
        </div>
      </div>

      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-md-6">
          <q-card class="stat-card q-pa-md">
            <div class="text-subtitle1 text-negative q-mb-sm">
              <q-icon name="event_busy" class="q-mr-xs" />Produits presque périmés (30 jours)
            </div>
            <q-list v-if="dashboard.bossStats.produits_peremption?.length" dense separator>
              <q-item v-for="p in dashboard.bossStats.produits_peremption" :key="p.id">
                <q-item-section>
                  <q-item-label>{{ p.nom }}</q-item-label>
                  <q-item-label caption>{{ p.grossiste_nom }} — péremption : {{ formatDate(p.date_peremption) }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge color="negative">{{ daysLeft(p.date_peremption) }}j</q-badge>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="text-grey-6">Aucun produit proche de la péremption</div>
          </q-card>
        </div>
        <div class="col-12 col-md-6">
          <q-card class="stat-card q-pa-md">
            <div class="text-subtitle1 text-warning q-mb-sm">
              <q-icon name="inventory" class="q-mr-xs" />Produits presque épuisés
            </div>
            <q-list v-if="dashboard.bossStats.produits_stock_faible?.length" dense separator>
              <q-item v-for="p in dashboard.bossStats.produits_stock_faible" :key="p.id">
                <q-item-section>
                  <q-item-label>{{ p.nom }}</q-item-label>
                  <q-item-label caption>{{ p.grossiste_nom }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge color="warning">
                    {{ p.stock }} / min {{ p.stock_min }} {{ p.unite_vente === 'kg' ? 'kg' : 'u.' }}
                  </q-badge>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="text-grey-6">Aucune alerte stock faible</div>
          </q-card>
        </div>
      </div>

      <div class="text-h6 q-mb-md">Vos grossistes</div>
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6 col-lg-4" v-for="g in dashboard.bossGrossistes" :key="g.id">
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
              <div class="col-6">CA disponible : {{ formatMontant(g.chiffre_affaires) }}</div>
              <div v-if="g.total_decaisse > 0" class="col-6 text-negative">
                Décaissé : {{ formatMontant(g.total_decaisse) }}
              </div>
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
import VentesBarChart from 'components/VentesBarChart.vue'

export default {
  name: 'BossDashboardPage',
  components: { VentesBarChart },
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
        { label: 'Décaissé', value: formatMontant(s.total_decaisse), color: 'text-negative' },
        { label: 'Solde', value: formatMontant(s.solde), color: 'text-positive' },
        { label: 'Employés', value: s.nb_employes ?? 0 },
        { label: 'Stock global', value: s.stock_global ?? 0 }
      ]
    })

    function formatDate (d) {
      return new Date(d).toLocaleDateString('fr-FR')
    }

    function daysLeft (d) {
      const diff = Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24))
      return diff <= 0 ? 0 : diff
    }

    function openGrossiste (grossiste) {
      auth.enterGrossiste(grossiste)
      router.push('/grossiste')
    }

    return { dashboard, globalStats, formatMontant, formatDate, daysLeft, openGrossiste }
  }
}
</script>
