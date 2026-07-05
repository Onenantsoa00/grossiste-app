<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h5 col">Ventes</div>
      <q-btn color="primary" icon="add_shopping_cart" label="Nouvelle vente" @click="showPanier = true" />
    </div>

    <q-table :rows="ventes" :columns="columns" row-key="id" :loading="loading" flat bordered />

    <q-dialog v-model="showPanier" maximized>
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6 col">Panier</div>
          <q-btn flat round icon="close" v-close-popup />
        </q-card-section>
        <q-separator />
        <q-card-section class="row q-col-gutter-md">
          <div class="col-12 col-md-7">
            <q-select
              v-model="selectedProduit"
              :options="produitOptions"
              label="Ajouter un produit"
              outlined
              use-input
              @update:model-value="addToPanier"
            />
            <q-table :rows="panier" :columns="panierColumns" row-key="produit_id" flat class="q-mt-md">
              <template #body-cell-qty="props">
                <q-td :props="props">
                  <q-input
                    dense
                    type="number"
                    :model-value="props.row.quantite"
                    @update:model-value="updateQty(props.row, $event)"
                    style="width: 80px"
                  />
                </q-td>
              </template>
              <template #body-cell-actions="props">
                <q-td :props="props">
                  <q-btn flat dense icon="delete" color="negative" @click="removeFromPanier(props.row)" />
                </q-td>
              </template>
            </q-table>
          </div>
          <div class="col-12 col-md-5">
            <q-select v-model="clientId" :options="clientOptions" label="Client (optionnel)" outlined emit-value map-options clearable />
            <q-input v-model.number="remise" label="Remise" type="number" outlined class="q-mt-md" />
            <q-input v-model.number="tva" label="TVA" type="number" outlined class="q-mt-md" />
            <q-input v-model.number="paiement" label="Montant payé" type="number" outlined class="q-mt-md" />
            <q-separator class="q-my-md" />
            <div class="text-h6">Total : {{ formatMontant(total) }}</div>
            <q-btn color="primary" label="Valider la vente" class="full-width q-mt-md" :loading="saving" @click="validerVente" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'
import { formatMontant } from 'stores/dashboard'

export default {
  name: 'VentesPage',
  setup () {
    const $q = useQuasar()
    const ventes = ref([])
    const produits = ref([])
    const clients = ref([])
    const loading = ref(false)
    const saving = ref(false)
    const showPanier = ref(false)
    const panier = ref([])
    const selectedProduit = ref(null)
    const clientId = ref(null)
    const remise = ref(0)
    const tva = ref(0)
    const paiement = ref(0)

    const columns = [
      { name: 'numero', label: 'N°', field: 'numero', align: 'left' },
      { name: 'date', label: 'Date', field: row => new Date(row.date).toLocaleString('fr-FR'), align: 'left' },
      { name: 'client_nom', label: 'Client', field: 'client_nom', align: 'left' },
      { name: 'total', label: 'Total', field: row => formatMontant(row.total), align: 'right' }
    ]

    const panierColumns = [
      { name: 'nom', label: 'Produit', field: 'nom', align: 'left' },
      { name: 'prix', label: 'Prix', field: row => formatMontant(row.prix), align: 'right' },
      { name: 'qty', label: 'Qté', field: 'quantite', align: 'center' },
      { name: 'total', label: 'Total', field: row => formatMontant(row.prix * row.quantite), align: 'right' },
      { name: 'actions', label: '', field: 'actions', align: 'center' }
    ]

    const produitOptions = computed(() =>
      produits.value.map(p => ({ label: `${p.nom} — ${formatMontant(p.prix_vente)}`, value: p }))
    )

    const clientOptions = computed(() =>
      clients.value.map(c => ({ label: c.nom, value: c.id }))
    )

    const sousTotal = computed(() =>
      panier.value.reduce((s, l) => s + l.prix * l.quantite, 0)
    )

    const total = computed(() => sousTotal.value - (remise.value || 0) + (tva.value || 0))

    async function load () {
      loading.value = true
      try {
        const [v, p, c] = await Promise.all([
          api.get('/ventes'),
          api.get('/produits'),
          api.get('/clients')
        ])
        ventes.value = v.data
        produits.value = p.data
        clients.value = c.data
      } finally {
        loading.value = false
      }
    }

    function addToPanier (produit) {
      if (!produit) return
      const existing = panier.value.find(l => l.produit_id === produit.id)
      if (existing) existing.quantite++
      else {
        panier.value.push({
          produit_id: produit.id,
          nom: produit.nom,
          prix: parseFloat(produit.prix_vente),
          quantite: 1
        })
      }
      selectedProduit.value = null
    }

    function updateQty (row, val) {
      row.quantite = Math.max(1, parseInt(val, 10) || 1)
    }

    function removeFromPanier (row) {
      panier.value = panier.value.filter(l => l.produit_id !== row.produit_id)
    }

    async function validerVente () {
      if (!panier.value.length) {
        $q.notify({ type: 'warning', message: 'Panier vide' })
        return
      }
      saving.value = true
      try {
        const paiements = paiement.value > 0
          ? [{ mode: 'especes', montant: paiement.value }]
          : []

        await api.post('/ventes', {
          client_id: clientId.value,
          remise: remise.value,
          tva: tva.value,
          lignes: panier.value.map(l => ({
            produit_id: l.produit_id,
            prix: l.prix,
            quantite: l.quantite
          })),
          paiements
        })

        $q.notify({ type: 'positive', message: 'Vente enregistrée' })
        panier.value = []
        clientId.value = null
        remise.value = 0
        tva.value = 0
        paiement.value = 0
        showPanier.value = false
        await load()
      } catch (err) {
        $q.notify({ type: 'negative', message: err.response?.data?.message || 'Erreur' })
      } finally {
        saving.value = false
      }
    }

    onMounted(load)

    return {
      ventes, loading, saving, showPanier, panier, selectedProduit,
      clientId, remise, tva, paiement, columns, panierColumns,
      produitOptions, clientOptions, total, formatMontant,
      addToPanier, updateQty, removeFromPanier, validerVente
    }
  }
}
</script>
