<template>
  <q-page class="q-pa-md page-responsive">
    <div class="row items-center q-mb-md q-col-gutter-sm">
      <div class="text-h5 col-12 col-sm">Ventes</div>
      <div class="col-12 col-sm-6 col-md-4">
        <q-input
          v-model="searchRecu"
          label="Rechercher un reçu"
          outlined
          dense
          clearable
          debounce="300"
          @update:model-value="load"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>
      <div class="col-12 col-sm-auto">
        <q-btn color="primary" icon="add_shopping_cart" label="Nouvelle vente" class="full-width-sm" @click="openPanier" />
      </div>
    </div>

    <q-table
      :rows="ventes"
      :columns="columns"
      row-key="id"
      :loading="loading"
      flat
      bordered
      :grid="$q.screen.xs"
      :pagination="{ rowsPerPage: 15 }"
    >
      <template #body-cell-recu="props">
        <q-td :props="props">
          <q-badge color="grey-8" :label="props.row.recu || props.row.numero" />
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn flat dense icon="receipt_long" color="primary" @click="showDetails(props.row)">
            <q-tooltip>Détail des produits</q-tooltip>
          </q-btn>
        </q-td>
      </template>
      <template #item="props">
        <div class="q-pa-xs col-12">
          <q-card bordered flat class="q-pa-sm">
            <div class="text-caption text-grey-7">Reçu : {{ props.row.recu || props.row.numero }}</div>
            <div class="text-subtitle2">{{ new Date(props.row.date).toLocaleString('fr-FR') }}</div>
            <div>{{ props.row.client_nom || 'Sans client' }}</div>
            <div class="text-h6 q-mt-xs">{{ formatMontant(props.row.total) }}</div>
            <q-btn flat dense icon="receipt_long" label="Détail" color="primary" class="q-mt-sm" @click="showDetails(props.row)" />
          </q-card>
        </div>
      </template>
    </q-table>

    <q-dialog v-model="showPanier" maximized @hide="onPanierHide">
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6 col">Panier</div>
          <q-btn flat round icon="close" v-close-popup />
        </q-card-section>
        <q-separator />
        <q-card-section class="row q-col-gutter-md">
          <div class="col-12 col-md-7">
            <div class="row q-col-gutter-sm items-end">
              <div class="col-12 col-sm-5">
                <q-select
                  v-model="filterCategorie"
                  :options="categorieOptions"
                  label="Catégorie"
                  outlined
                  dense
                  emit-value
                  map-options
                  clearable
                  @update:model-value="refreshProduitOptions(produitFilter)"
                />
              </div>
              <div class="col-12 col-sm-7">
                <q-select
                  v-model="selectedProduit"
                  :options="produitOptionsFiltered"
                  label="Rechercher un produit (taper pour filtrer)"
                  outlined
                  emit-value
                  map-options
                  use-input
                  fill-input
                  hide-selected
                  input-debounce="150"
                  clearable
                  @filter="filterProduits"
                  @update:model-value="onProduitSelected"
                >
                  <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section>
                        <q-item-label>{{ scope.opt.label }}</q-item-label>
                        <q-item-label caption>{{ scope.opt.caption }}</q-item-label>
                      </q-item-section>
                      <q-item-section side v-if="scope.opt.stock <= 0">
                        <q-badge color="negative">Rupture</q-badge>
                      </q-item-section>
                    </q-item>
                  </template>
                  <template #no-option>
                    <q-item>
                      <q-item-section class="text-grey">Aucun produit trouvé — tapez pour rechercher</q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
            </div>

            <q-table
              :rows="panier"
              :columns="panierColumns"
              :row-key="row => `${row.produit_id}-${row.type_prix}`"
              flat
              bordered
              class="q-mt-md"
              :pagination="{ rowsPerPage: 0 }"
              hide-pagination
            >
              <template #body-cell-nom="props">
                <q-td :props="props">
                  <div>{{ props.row.nom }}</div>
                  <div class="text-caption text-grey-7">
                    {{ labelTypePrix(props.row.type_prix) }}
                    — {{ isKg(props.row.unite_vente) ? 'au kilo' : 'à l\'unité' }}
                  </div>
                </q-td>
              </template>
              <template #body-cell-prix="props">
                <q-td :props="props">
                  {{ formatMontant(props.row.prix) }}{{ unitePrixSuffix(props.row.unite_vente) }}
                </q-td>
              </template>
              <template #body-cell-qty="props">
                <q-td :props="props">
                  <q-input
                    dense
                    type="number"
                    :model-value="props.row.quantite"
                    :step="qtyStep(props.row.unite_vente)"
                    :min="qtyMin(props.row.unite_vente)"
                    @update:model-value="updateQty(props.row, $event)"
                    style="width: 100px"
                  >
                    <template #append>
                      <span class="text-caption">{{ uniteLabel(props.row.unite_vente) }}</span>
                    </template>
                  </q-input>
                </q-td>
              </template>
              <template #body-cell-actions="props">
                <q-td :props="props">
                  <q-btn flat dense icon="delete" color="negative" @click="removeFromPanier(props.row)" />
                </q-td>
              </template>
              <template #no-data>
                <div class="full-width text-center text-grey-6 q-pa-lg">
                  Ajoutez des produits depuis la recherche ci-dessus
                </div>
              </template>
            </q-table>
          </div>

          <div class="col-12 col-md-5">
            <q-select
              v-model="clientId"
              :options="clientOptions"
              label="Client (optionnel)"
              outlined
              emit-value
              map-options
              clearable
              use-input
              input-debounce="200"
              @filter="filterClients"
            />
            <q-input v-model.number="remise" label="Remise (Ar)" type="number" outlined class="q-mt-md" min="0" />
            <q-input v-model.number="tva" label="TVA (Ar)" type="number" outlined class="q-mt-md" min="0" />
            <q-separator class="q-my-md" />
            <div class="q-gutter-xs">
              <div class="row justify-between">
                <span>Sous-total</span>
                <span>{{ formatMontant(sousTotal) }}</span>
              </div>
              <div v-if="remise > 0" class="row justify-between text-negative">
                <span>Remise</span>
                <span>- {{ formatMontant(remise) }}</span>
              </div>
              <div v-if="tva > 0" class="row justify-between">
                <span>TVA</span>
                <span>+ {{ formatMontant(tva) }}</span>
              </div>
              <div class="row justify-between text-h6 q-mt-sm">
                <span>Total à payer</span>
                <span>{{ formatMontant(total) }}</span>
              </div>
            </div>
            <q-input
              v-model.number="montantRemis"
              label="Montant remis par le client (Ar)"
              type="number"
              outlined
              class="q-mt-md"
              min="0"
              hint="Saisissez l'argent que le client vous donne"
            />
            <q-card v-if="montantRemis > 0" flat bordered class="q-mt-md q-pa-md" :class="monnaieARendre > 0 ? 'bg-amber-1' : 'bg-grey-2'">
              <div class="row justify-between items-center">
                <span class="text-subtitle1">Monnaie à rendre</span>
                <span class="text-h5 text-weight-bold" :class="monnaieARendre > 0 ? 'text-amber-10' : 'text-grey-7'">
                  {{ formatMontant(monnaieARendre) }}
                </span>
              </div>
              <div v-if="montantRemis < total" class="text-caption text-negative q-mt-xs">
                Reste à payer : {{ formatMontant(total - montantRemis) }}
              </div>
            </q-card>
            <q-btn
              color="primary"
              label="Valider la vente"
              icon="check"
              class="full-width q-mt-md"
              :loading="saving"
              :disable="!panier.length"
              @click="validerVente"
            />
            <q-btn
              flat
              label="Client paie le total exact"
              class="full-width q-mt-sm"
              :disable="total <= 0"
              @click="montantRemis = total"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showAddDialog" persistent :maximized="$q.screen.xs">
      <q-card style="min-width: 360px">
        <q-card-section class="text-h6">Ajouter au panier</q-card-section>
        <q-card-section v-if="produitToAdd" class="q-gutter-md">
          <div class="text-subtitle1">{{ produitToAdd.nom }}</div>
          <q-option-group
            v-model="addTypePrix"
            :options="addTypePrixOptions"
            color="primary"
            inline
          />
          <div class="text-body2">
            Prix sélectionné :
            {{ formatMontant(prixSelectionne) }}{{ unitePrixSuffix(produitToAdd.unite_vente) }}
          </div>
          <div class="text-caption text-grey-7" v-if="conversionHint(produitToAdd)">
            {{ conversionHint(produitToAdd) }}
          </div>
          <div class="text-caption text-grey-7">
            Stock disponible : {{ formatQuantite(stockDisponible(produitToAdd, addTypePrix), produitToAdd.unite_vente) }}
            {{ uniteLabel(produitToAdd.unite_vente) }}
            <span v-if="addTypePrix === 'carton' || addTypePrix === 'sac'">
              (max {{ maxVendableDispo(produitToAdd) }} {{ labelVenteType(addTypePrix) }})
            </span>
          </div>
          <q-input
            v-model.number="addQty"
            :label="addQtyLabel"
            type="number"
            outlined
            :step="addQtyStep"
            :min="1"
            autofocus
            @keyup.enter="confirmAddToPanier"
          />
          <div class="text-body2 text-right">
            Ligne : <strong>{{ formatMontant(prixSelectionne * (addQty || 0)) }}</strong>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Annuler" @click="cancelAdd" />
          <q-btn color="primary" label="Ajouter" @click="confirmAddToPanier" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showDetailDialog" :maximized="$q.screen.xs">
      <q-card class="dialog-card">
        <q-card-section class="row items-center">
          <div class="col">
            <div class="text-h6">Détail de la vente</div>
            <div v-if="venteDetail" class="text-caption text-grey-7">
              Reçu : <strong>{{ venteDetail.recu || venteDetail.numero }}</strong>
              — {{ new Date(venteDetail.date).toLocaleString('fr-FR') }}
            </div>
          </div>
          <q-btn flat round icon="close" v-close-popup />
        </q-card-section>
        <q-separator />
        <q-card-section v-if="detailLoading" class="flex flex-center q-pa-xl">
          <q-spinner color="primary" size="2em" />
        </q-card-section>
        <q-card-section v-else-if="venteDetail">
          <div class="q-mb-md">
            <div><strong>Client :</strong> {{ venteDetail.client_nom || '—' }}</div>
            <div><strong>Total :</strong> {{ formatMontant(venteDetail.total) }}</div>
            <div v-if="venteDetail.remise > 0"><strong>Remise :</strong> {{ formatMontant(venteDetail.remise) }}</div>
          </div>
          <q-table
            :rows="venteDetail.lignes || []"
            :columns="detailColumns"
            row-key="id"
            flat
            bordered
            hide-pagination
            :pagination="{ rowsPerPage: 0 }"
          />
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
import {
  stockDeduction, maxVendable, labelVenteType, conversionHint
} from '../../utils/stockConversion'
import {
  isKg, uniteLabel, unitePrixSuffix, formatQuantite,
  parseQuantiteInput, qtyStep, qtyMin, defaultQty
} from '../../utils/unites'

export default {
  name: 'VentesPage',
  setup () {
    const $q = useQuasar()
    const ventes = ref([])
    const produits = ref([])
    const categories = ref([])
    const clients = ref([])
    const loading = ref(false)
    const saving = ref(false)
    const detailLoading = ref(false)
    const showPanier = ref(false)
    const showAddDialog = ref(false)
    const showDetailDialog = ref(false)
    const panier = ref([])
    const selectedProduit = ref(null)
    const produitToAdd = ref(null)
    const venteDetail = ref(null)
    const addQty = ref(1)
    const addTypePrix = ref('unitaire')
    const produitFilter = ref('')
    const clientFilter = ref('')
    const filterCategorie = ref(null)
    const searchRecu = ref('')
    const clientId = ref(null)
    const remise = ref(0)
    const tva = ref(0)
    const montantRemis = ref(0)

    const PRIX_FIELD = {
      unitaire: 'prix_vente',
      grossiste: 'prix_grossiste',
      carton: 'prix_carton',
      sac: 'prix_sac'
    }

    function labelTypePrix (type) {
      const labels = {
        unitaire: 'Prix unitaire',
        grossiste: 'Prix grossiste',
        carton: 'Prix carton',
        sac: 'Prix sac'
      }
      return labels[type] || type
    }

    const columns = [
      { name: 'recu', label: 'N° Reçu', field: 'recu', align: 'left' },
      { name: 'numero', label: 'N° Vente', field: 'numero', align: 'left' },
      { name: 'date', label: 'Date', field: row => new Date(row.date).toLocaleString('fr-FR'), align: 'left' },
      { name: 'client_nom', label: 'Client', field: 'client_nom', align: 'left' },
      { name: 'total', label: 'Total', field: row => formatMontant(row.total), align: 'right' },
      { name: 'actions', label: '', field: 'actions', align: 'center' }
    ]

    const panierColumns = [
      { name: 'nom', label: 'Produit', field: 'nom', align: 'left' },
      { name: 'prix', label: 'Prix', field: 'prix', align: 'right' },
      { name: 'qty', label: 'Quantité', field: 'quantite', align: 'center' },
      { name: 'total', label: 'Total', field: row => formatMontant(row.prix * row.quantite), align: 'right' },
      { name: 'actions', label: '', field: 'actions', align: 'center' }
    ]

    const detailColumns = [
      { name: 'produit_nom', label: 'Produit', field: 'produit_nom', align: 'left' },
      { name: 'type_prix', label: 'Tarif', field: row => labelTypePrix(row.type_prix), align: 'center' },
      { name: 'prix', label: 'Prix', field: row => formatMontant(row.prix), align: 'right' },
      { name: 'quantite', label: 'Qté', field: 'quantite', align: 'center' },
      { name: 'total', label: 'Total', field: row => formatMontant(row.total), align: 'right' }
    ]

    const categorieOptions = computed(() =>
      categories.value.map(c => ({ label: c.nom, value: c.id }))
    )

    function buildProduitOption (p) {
      const stock = parseFloat(p.stock || 0)
      return {
        label: p.nom,
        value: p,
        stock,
        categorie_id: p.categorie_id,
        caption: `${p.categorie_nom || 'Sans cat.'} — ${formatMontant(p.prix_vente)}${unitePrixSuffix(p.unite_vente)} — Stock: ${formatQuantite(stock, p.unite_vente)} ${uniteLabel(p.unite_vente)}`
      }
    }

    const produitOptionsFiltered = ref([])

    function refreshProduitOptions (filterText = '') {
      const q = filterText.trim().toLowerCase()
      let list = produits.value.map(buildProduitOption)
      if (filterCategorie.value) {
        list = list.filter(o => o.categorie_id === filterCategorie.value)
      }
      if (q) {
        list = list.filter(o =>
          o.label.toLowerCase().includes(q) ||
          o.caption.toLowerCase().includes(q)
        )
      }
      produitOptionsFiltered.value = list
    }

    const clientOptions = ref([])

    function refreshClientOptions (filterText = '') {
      const q = filterText.trim().toLowerCase()
      clientOptions.value = clients.value
        .filter(c => !q || c.nom.toLowerCase().includes(q))
        .map(c => ({ label: c.nom, value: c.id }))
    }

    const addTypePrixOptions = computed(() => {
      const p = produitToAdd.value
      if (!p) return []
      const opts = [
        { label: 'Prix unitaire', value: 'unitaire' },
        { label: 'Prix grossiste', value: 'grossiste' },
        { label: 'Prix carton', value: 'carton' },
        { label: 'Prix sac', value: 'sac' }
      ]
      return opts.filter(o => {
        if (o.value === 'unitaire') return true
        if (o.value === 'grossiste') return parseFloat(p.prix_grossiste || 0) > 0
        if (o.value === 'carton') return parseFloat(p.prix_carton || 0) > 0 && parseFloat(p.qte_par_carton || 0) > 0
        if (o.value === 'sac') return parseFloat(p.prix_sac || 0) > 0 && parseFloat(p.qte_par_sac || 0) > 0
        return false
      })
    })

    const addQtyLabel = computed(() => {
      if (!produitToAdd.value) return 'Quantité'
      if (addTypePrix.value === 'carton') return 'Nombre de cartons'
      if (addTypePrix.value === 'sac') return 'Nombre de sacs'
      return isKg(produitToAdd.value.unite_vente) ? 'Quantité (kg)' : 'Quantité (unités)'
    })

    const addQtyStep = computed(() => {
      if (addTypePrix.value === 'carton' || addTypePrix.value === 'sac') return 1
      return qtyStep(produitToAdd.value?.unite_vente || 'piece')
    })

    const prixSelectionne = computed(() => {
      if (!produitToAdd.value) return 0
      const field = PRIX_FIELD[addTypePrix.value] || 'prix_vente'
      return parseFloat(produitToAdd.value[field] || 0)
    })

    const sousTotal = computed(() =>
      panier.value.reduce((s, l) => s + l.prix * l.quantite, 0)
    )

    const total = computed(() =>
      Math.max(0, sousTotal.value - (remise.value || 0) + (tva.value || 0))
    )

    const monnaieARendre = computed(() =>
      Math.max(0, (montantRemis.value || 0) - total.value)
    )

    function stockUsedInPanier (produitId) {
      return panier.value
        .filter(l => l.produit_id === produitId)
        .reduce((s, l) => s + stockDeduction(l.quantite, l.type_prix, l), 0)
    }

    function stockDisponible (produit, typePrix = null) {
      const used = stockUsedInPanier(produit.id)
      return parseFloat(produit.stock || 0) - used
    }

    function maxVendableDispo (produit) {
      const dispo = stockDisponible(produit, addTypePrix.value)
      return maxVendable(dispo, addTypePrix.value, produit)
    }

    function filterProduits (val, update) {
      update(() => {
        produitFilter.value = val
        refreshProduitOptions(val)
      })
    }

    function filterClients (val, update) {
      update(() => {
        clientFilter.value = val
        refreshClientOptions(val)
      })
    }

    async function load () {
      loading.value = true
      try {
        const params = {}
        if (searchRecu.value?.trim()) params.recu = searchRecu.value.trim()
        const [v, p, c, cat] = await Promise.all([
          api.get('/ventes', { params }),
          api.get('/produits'),
          api.get('/clients'),
          api.get('/categories')
        ])
        ventes.value = v.data
        produits.value = p.data
        clients.value = c.data
        categories.value = cat.data
        refreshProduitOptions()
        refreshClientOptions()
      } finally {
        loading.value = false
      }
    }

    function resetPanierForm () {
      panier.value = []
      selectedProduit.value = null
      clientId.value = null
      remise.value = 0
      tva.value = 0
      montantRemis.value = 0
      produitFilter.value = ''
      filterCategorie.value = null
    }

    function openPanier () {
      resetPanierForm()
      refreshProduitOptions()
      showPanier.value = true
    }

    function onPanierHide () {
      selectedProduit.value = null
    }

    function onProduitSelected (produit) {
      selectedProduit.value = null
      if (!produit) return

      if (parseFloat(produit.stock || 0) <= 0) {
        $q.notify({ type: 'warning', message: 'Produit en rupture de stock' })
        return
      }

      produitToAdd.value = produit
      addQty.value = defaultQty(produit.unite_vente)
      addTypePrix.value = 'unitaire'
      showAddDialog.value = true
    }

    function cancelAdd () {
      showAddDialog.value = false
      produitToAdd.value = null
    }

    function confirmAddToPanier () {
      const produit = produitToAdd.value
      if (!produit) return

      const prix = prixSelectionne.value
      if (prix <= 0) {
        $q.notify({ type: 'warning', message: 'Le prix sélectionné doit être supérieur à 0' })
        return
      }

      const qty = addTypePrix.value === 'carton' || addTypePrix.value === 'sac'
        ? (Number.isInteger(addQty.value) && addQty.value > 0 ? addQty.value : null)
        : parseQuantiteInput(addQty.value, produit.unite_vente)
      if (qty == null) {
        const msg = addTypePrix.value === 'carton' || addTypePrix.value === 'sac'
          ? 'Entrez un nombre entier de cartons/sacs supérieur à 0'
          : isKg(produit.unite_vente)
            ? 'Entrez une quantité en kg supérieure à 0'
            : 'Entrez un nombre entier supérieur à 0'
        $q.notify({ type: 'warning', message: msg })
        return
      }

      const ded = stockDeduction(qty, addTypePrix.value, produit)
      const used = stockUsedInPanier(produit.id)
      if (used + ded > parseFloat(produit.stock || 0)) {
        $q.notify({
          type: 'warning',
          message: `Stock insuffisant (retrait : ${formatQuantite(ded, produit.unite_vente)} ${uniteLabel(produit.unite_vente)})`
        })
        return
      }

      const existing = panier.value.find(
        l => l.produit_id === produit.id && l.type_prix === addTypePrix.value
      )
      if (existing) {
        existing.quantite = Math.round((existing.quantite + qty) * 1000) / 1000
      } else {
        panier.value.push({
          produit_id: produit.id,
          nom: produit.nom,
          prix,
          type_prix: addTypePrix.value,
          quantite: qty,
          unite_vente: produit.unite_vente || 'piece',
          stock: parseFloat(produit.stock || 0),
          qte_par_carton: produit.qte_par_carton,
          qte_par_sac: produit.qte_par_sac
        })
      }

      cancelAdd()
    }

    function updateQty (row, val) {
      const qty = parseQuantiteInput(val, row.unite_vente)
      if (qty == null) {
        $q.notify({
          type: 'warning',
          message: isKg(row.unite_vente) ? 'Quantité kg invalide' : 'Quantité entière requise'
        })
        return
      }
      const otherDed = panier.value
        .filter(l => l.produit_id === row.produit_id && l !== row)
        .reduce((s, l) => s + stockDeduction(l.quantite, l.type_prix, l), 0)
      const ded = stockDeduction(qty, row.type_prix, row)
      if (otherDed + ded > row.stock) {
        $q.notify({
          type: 'warning',
          message: `Stock max dépassé pour ce produit`
        })
        return
      }
      row.quantite = qty
    }

    function removeFromPanier (row) {
      panier.value = panier.value.filter(
        l => !(l.produit_id === row.produit_id && l.type_prix === row.type_prix)
      )
    }

    async function validerVente () {
      if (!panier.value.length) {
        $q.notify({ type: 'warning', message: 'Panier vide' })
        return
      }

      for (const ligne of panier.value) {
        const totalDed = panier.value
          .filter(l => l.produit_id === ligne.produit_id)
          .reduce((s, l) => s + stockDeduction(l.quantite, l.type_prix, l), 0)
        if (ligne.quantite <= 0 || totalDed > ligne.stock) {
          $q.notify({ type: 'warning', message: `Quantité invalide pour « ${ligne.nom} »` })
          return
        }
      }

      saving.value = true
      try {
        const montantPaye = montantRemis.value > 0
          ? Math.min(montantRemis.value, total.value)
          : 0
        const paiements = montantPaye > 0
          ? [{ mode: 'especes', montant: montantPaye }]
          : []

        const { data } = await api.post('/ventes', {
          client_id: clientId.value,
          remise: remise.value || 0,
          tva: tva.value || 0,
          lignes: panier.value.map(l => ({
            produit_id: l.produit_id,
            prix: l.prix,
            quantite: l.quantite,
            type_prix: l.type_prix
          })),
          paiements
        })

        $q.notify({
          type: 'positive',
          message: `Vente enregistrée — Reçu : ${data.recu || data.numero}`
        })
        showPanier.value = false
        resetPanierForm()
        await load()
      } catch (err) {
        $q.notify({ type: 'negative', message: err.response?.data?.message || 'Erreur lors de la vente' })
      } finally {
        saving.value = false
      }
    }

    async function showDetails (row) {
      showDetailDialog.value = true
      detailLoading.value = true
      venteDetail.value = null
      try {
        const { data } = await api.get(`/ventes/${row.id}`)
        venteDetail.value = data
      } catch (err) {
        $q.notify({ type: 'negative', message: err.response?.data?.message || 'Erreur' })
        showDetailDialog.value = false
      } finally {
        detailLoading.value = false
      }
    }

    onMounted(load)

    return {
      ventes, loading, saving, detailLoading, showPanier, showAddDialog, showDetailDialog,
      panier, selectedProduit, produitToAdd, venteDetail, addQty, addTypePrix,
      clientId, remise, tva, montantRemis, monnaieARendre, searchRecu, filterCategorie,
      columns, panierColumns, detailColumns, produitOptionsFiltered, clientOptions,
      categorieOptions, addTypePrixOptions, prixSelectionne, labelTypePrix,
      addQtyLabel, addQtyStep, conversionHint, labelVenteType, maxVendableDispo,
      sousTotal, total, formatMontant,
      isKg, uniteLabel, unitePrixSuffix, formatQuantite, qtyStep, qtyMin,
      stockDisponible, filterProduits, filterClients, refreshProduitOptions,
      openPanier, onPanierHide,
      onProduitSelected, cancelAdd, confirmAddToPanier,
      updateQty, removeFromPanier, validerVente, showDetails
    }
  }
}
</script>
