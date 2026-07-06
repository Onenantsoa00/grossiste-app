<template>
  <q-page class="q-pa-md page-responsive">
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
              <q-item-label caption>
                Stock: {{ formatQuantite(a.stock, a.unite_vente) }} {{ uniteLabel(a.unite_vente) }}
                / Min: {{ formatQuantite(a.stock_min, a.unite_vente) }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge color="negative">Rupture</q-badge>
            </q-item-section>
          </q-item>
        </q-list>
        <div v-else class="text-grey-6 text-center q-pa-lg">Aucune alerte</div>
      </q-tab-panel>

      <q-tab-panel name="nouveau">
        <q-card flat bordered class="q-pa-md" style="max-width: 560px">
          <q-form @submit.prevent="createMouvement" class="q-gutter-md">
            <q-select v-model="form.produit_id" :options="produitOptions" label="Produit" outlined emit-value map-options />
            <q-select v-model="form.type" :options="typeOptions" label="Type" outlined emit-value map-options />

            <q-banner dense rounded class="bg-blue-1 text-blue-10">
              <template #avatar><q-icon name="info" color="primary" /></template>
              <div class="text-weight-medium q-mb-xs">{{ typeHelp.title }}</div>
              <div class="text-caption">{{ typeHelp.description }}</div>
            </q-banner>

            <q-input
              v-model.number="form.quantite"
              :label="quantiteLabel"
              type="number"
              outlined
              :step="selectedStep"
              :min="selectedMin"
            />

            <q-input
              v-if="form.type === 'entree'"
              v-model.number="form.cout_achat"
              label="Montant dépensé pour cet achat (Ar)"
              type="number"
              outlined
              min="0"
              step="0.01"
              hint="Coût total payé au fournisseur pour cette entrée de stock"
            />

            <q-input v-model="form.motif" label="Motif / référence" outlined />
            <q-btn type="submit" color="primary" label="Enregistrer" :loading="saving" />
          </q-form>
        </q-card>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'
import { formatMontant } from 'stores/dashboard'
import { isKg, uniteLabel, formatQuantite, qtyStep, qtyMin } from '../../utils/unites'

const TYPE_HELP = {
  entree: {
    title: 'Entrée — Réception de marchandise',
    description: 'Augmente le stock. Utilisez ce type quand vous recevez des produits (achat fournisseur, livraison). Indiquez le montant dépensé pour suivre vos coûts d\'achat.'
  },
  sortie: {
    title: 'Sortie — Retrait manuel',
    description: 'Diminue le stock sans vente. Exemples : produit cassé, périmé jeté, échantillon offert, perte ou vol constaté.'
  },
  inventaire: {
    title: 'Inventaire — Comptage physique',
    description: 'Remplace le stock par la quantité réelle comptée. Exemple : après inventaire annuel, il reste exactement 230 pièces en rayon.'
  },
  ajustement: {
    title: 'Ajustement — Correction',
    description: 'Corrige une erreur de saisie ou un écart constaté. Comme l\'inventaire, définit la nouvelle valeur exacte du stock (produit retrouvé, erreur corrigée).'
  }
}

export default {
  name: 'StockPage',
  setup () {
    const $q = useQuasar()
    const tab = ref('mouvements')
    const mouvements = ref([])
    const alertes = ref([])
    const produits = ref([])
    const loading = ref(false)
    const saving = ref(false)
    const form = ref({ produit_id: null, type: 'entree', quantite: 1, motif: '', cout_achat: 0 })

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
      { name: 'cout_achat', label: 'Coût', field: row => row.cout_achat > 0 ? formatMontant(row.cout_achat) : '—', align: 'right' },
      { name: 'motif', label: 'Motif', field: 'motif', align: 'left' }
    ]

    const typeHelp = computed(() => TYPE_HELP[form.value.type] || TYPE_HELP.entree)

    const produitOptions = computed(() =>
      produits.value.map(p => ({
        label: `${p.nom} (${isKg(p.unite_vente) ? 'kg' : 'unité'})`,
        value: p.id
      }))
    )

    const selectedProduit = computed(() =>
      produits.value.find(p => p.id === form.value.produit_id)
    )

    const selectedStep = computed(() =>
      qtyStep(selectedProduit.value?.unite_vente || 'piece')
    )

    const selectedMin = computed(() =>
      qtyMin(selectedProduit.value?.unite_vente || 'piece')
    )

    const quantiteLabel = computed(() => {
      const p = selectedProduit.value
      if (!p) return 'Quantité'
      if (form.value.type === 'inventaire' || form.value.type === 'ajustement') {
        return isKg(p.unite_vente) ? 'Nouveau stock réel (kg)' : 'Nouveau stock réel (unités)'
      }
      return isKg(p.unite_vente) ? 'Quantité (kg)' : 'Quantité (unités)'
    })

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
        produits.value = pr.data
      } finally {
        loading.value = false
      }
    }

    async function createMouvement () {
      saving.value = true
      try {
        const payload = { ...form.value }
        if (payload.type !== 'entree') delete payload.cout_achat
        await api.post('/stock/mouvements', payload)
        $q.notify({ type: 'positive', message: 'Mouvement enregistré' })
        form.value = { produit_id: null, type: 'entree', quantite: 1, motif: '', cout_achat: 0 }
        tab.value = 'mouvements'
        await load()
      } catch (err) {
        $q.notify({ type: 'negative', message: err.response?.data?.message || 'Erreur' })
      } finally {
        saving.value = false
      }
    }

    onMounted(load)
    return {
      tab, mouvements, alertes, produitOptions, loading, saving, form,
      typeOptions, typeHelp, mvColumns, selectedStep, selectedMin, quantiteLabel,
      isKg, uniteLabel, formatQuantite, createMouvement
    }
  }
}
</script>
