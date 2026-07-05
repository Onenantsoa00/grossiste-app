<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Gestion du stock</div>

    <q-tabs v-model="tab" class="q-mb-md">
      <q-tab name="mouvements" label="Historique" />
      <q-tab name="alertes" label="Alertes stock faible" />
      <q-tab name="nouveau" label="Nouveau mouvement" />
    </q-tabs>

    <q-tab-panels v-model="tab" animated>
      <q-tab-panel name="mouvements">
        <q-table :rows="mouvements" :columns="mvColumns" row-key="id" :loading="loading" flat bordered />
      </q-tab-panel>

      <q-tab-panel name="alertes">
        <q-list bordered separator v-if="alertes.length">
          <q-item v-for="a in alertes" :key="a.id">
            <q-item-section>
              <q-item-label>{{ a.nom }}</q-item-label>
              <q-item-label caption>Stock: {{ a.stock }} / Min: {{ a.stock_min }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge color="negative">Rupture</q-badge>
            </q-item-section>
          </q-item>
        </q-list>
        <div v-else class="text-grey-6 text-center q-pa-lg">Aucune alerte</div>
      </q-tab-panel>

      <q-tab-panel name="nouveau">
        <q-card flat bordered class="q-pa-md" style="max-width: 500px">
          <q-form @submit.prevent="createMouvement" class="q-gutter-md">
            <q-select v-model="form.produit_id" :options="produitOptions" label="Produit" outlined emit-value map-options />
            <q-select v-model="form.type" :options="typeOptions" label="Type" outlined emit-value map-options />
            <q-input v-model.number="form.quantite" label="Quantité" type="number" outlined />
            <q-input v-model="form.motif" label="Motif" outlined />
            <q-btn type="submit" color="primary" label="Enregistrer" :loading="saving" />
          </q-form>
        </q-card>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

export default {
  name: 'StockPage',
  setup () {
    const $q = useQuasar()
    const tab = ref('mouvements')
    const mouvements = ref([])
    const alertes = ref([])
    const produitOptions = ref([])
    const loading = ref(false)
    const saving = ref(false)
    const form = ref({ produit_id: null, type: 'entree', quantite: 1, motif: '' })

    const typeOptions = [
      { label: 'Entrée', value: 'entree' },
      { label: 'Sortie', value: 'sortie' },
      { label: 'Inventaire', value: 'inventaire' },
      { label: 'Ajustement', value: 'ajustement' }
    ]

    const mvColumns = [
      { name: 'date', label: 'Date', field: row => new Date(row.date).toLocaleString('fr-FR'), align: 'left' },
      { name: 'produit_nom', label: 'Produit', field: 'produit_nom', align: 'left' },
      { name: 'type', label: 'Type', field: 'type', align: 'left' },
      { name: 'quantite', label: 'Qté', field: 'quantite', align: 'center' },
      { name: 'motif', label: 'Motif', field: 'motif', align: 'left' }
    ]

    async function load () {
      loading.value = true
      try {
        const [mv, al, pr] = await Promise.all([
          api.get('/stock/mouvements'),
          api.get('/stock/alertes'),
          api.get('/produits')
        ])
        mouvements.value = mv.data
        alertes.value = al.data
        produitOptions.value = pr.data.map(p => ({ label: p.nom, value: p.id }))
      } finally {
        loading.value = false
      }
    }

    async function createMouvement () {
      saving.value = true
      try {
        await api.post('/stock/mouvements', form.value)
        $q.notify({ type: 'positive', message: 'Mouvement enregistré' })
        form.value = { produit_id: null, type: 'entree', quantite: 1, motif: '' }
        tab.value = 'mouvements'
        await load()
      } catch (err) {
        $q.notify({ type: 'negative', message: err.response?.data?.message || 'Erreur' })
      } finally {
        saving.value = false
      }
    }

    onMounted(load)
    return { tab, mouvements, alertes, produitOptions, loading, saving, form, typeOptions, mvColumns, createMouvement }
  }
}
</script>
