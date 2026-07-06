<template>
  <q-page class="q-pa-md page-responsive">
    <div class="row items-center q-mb-md q-col-gutter-sm">
      <div class="text-h5 col-12 col-sm">Produits</div>
      <div class="col-12 col-sm-auto row q-gutter-sm">
        <q-btn outline color="primary" icon="category" label="Catégories" @click="showCategories = true" />
        <q-btn color="primary" icon="add" label="Ajouter" @click="openDialog()" />
      </div>
    </div>

    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-12 col-sm-6 col-md-4">
        <q-input v-model="searchQuery" label="Rechercher un produit" outlined dense clearable debounce="300" @update:model-value="load">
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>
      <div class="col-12 col-sm-6 col-md-4">
        <q-select
          v-model="filterCategorie"
          :options="categorieOptions"
          label="Filtrer par catégorie"
          outlined
          dense
          emit-value
          map-options
          clearable
          @update:model-value="load"
        />
      </div>
    </div>

    <q-table
      :rows="rows"
      :columns="columns"
      row-key="id"
      :loading="loading"
      flat
      bordered
      :grid="$q.screen.xs"
      :pagination="{ rowsPerPage: 15 }"
    >
      <template #body-cell-unite_vente="props">
        <q-td :props="props">
          <q-badge :color="isKg(props.row.unite_vente) ? 'orange' : 'blue-grey'">
            {{ isKg(props.row.unite_vente) ? 'Kilo' : 'Unité' }}
          </q-badge>
        </q-td>
      </template>
      <template #body-cell-date_peremption="props">
        <q-td :props="props">
          <span v-if="props.row.date_peremption" :class="isExpired(props.row.date_peremption) ? 'text-negative' : ''">
            {{ formatDate(props.row.date_peremption) }}
          </span>
          <span v-else class="text-grey-5">—</span>
        </q-td>
      </template>
      <template #body-cell-stock="props">
        <q-td :props="props">
          <q-badge :color="props.row.stock <= props.row.stock_min ? 'negative' : 'positive'">
            {{ formatQuantite(props.row.stock, props.row.unite_vente) }}
            {{ uniteLabel(props.row.unite_vente) }}
          </q-badge>
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn flat dense icon="edit" @click="openDialog(props.row)" />
          <q-btn flat dense icon="delete" color="negative" @click="remove(props.row)" />
        </q-td>
      </template>
      <template #item="props">
        <div class="q-pa-xs col-12">
          <q-card bordered flat class="q-pa-sm">
            <div class="text-subtitle1">{{ props.row.nom }}</div>
            <div class="text-caption text-grey-7">{{ props.row.categorie_nom || 'Sans catégorie' }}</div>
            <div class="q-mt-xs">Prix : {{ formatMontant(props.row.prix_vente) }}</div>
            <div>Stock : {{ formatQuantite(props.row.stock, props.row.unite_vente) }} {{ uniteLabel(props.row.unite_vente) }}</div>
            <div class="row q-mt-sm q-gutter-xs">
              <q-btn flat dense icon="edit" @click="openDialog(props.row)" />
              <q-btn flat dense icon="delete" color="negative" @click="remove(props.row)" />
            </div>
          </q-card>
        </div>
      </template>
    </q-table>

    <q-dialog v-model="dialog" :maximized="$q.screen.xs">
      <q-card class="dialog-card">
        <q-card-section class="text-h6">{{ form.id ? 'Modifier' : 'Ajouter' }} produit</q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.nom" label="Nom *" outlined />
          <q-select
            v-model="form.categorie_id"
            :options="categorieOptions"
            label="Catégorie"
            outlined
            emit-value
            map-options
            clearable
          />
          <q-input v-model="form.reference" label="Référence" outlined />
          <q-input v-model="form.code_barre" label="Code-barres" outlined />
          <q-input v-model="form.date_peremption" label="Date de péremption (optionnel)" type="date" outlined clearable />
          <q-select
            v-model="form.unite_vente"
            :options="UNITE_OPTIONS"
            label="Mode de vente *"
            outlined
            emit-value
            map-options
          />
          <div class="text-caption text-grey-7">
            {{ isKg(form.unite_vente)
              ? 'Prix et stock exprimés au kilogramme (ex. 2,5 kg).'
              : 'Prix et stock exprimés à l\'unité (nombre entier).' }}
          </div>
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-4"><q-input v-model.number="form.prix_achat" label="Prix achat" type="number" outlined step="0.01" /></div>
            <div class="col-12 col-sm-4">
              <q-input v-model.number="form.prix_vente" :label="`Prix unitaire ${unitePrixSuffix(form.unite_vente)}`" type="number" outlined step="0.01" />
            </div>
            <div class="col-12 col-sm-4"><q-input v-model.number="form.prix_grossiste" label="Prix grossiste" type="number" outlined step="0.01" /></div>
          </div>
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6"><q-input v-model.number="form.prix_carton" label="Prix carton (ex. savon)" type="number" outlined step="0.01" /></div>
            <div class="col-12 col-sm-6"><q-input v-model.number="form.prix_sac" label="Prix sac (ex. riz)" type="number" outlined step="0.01" /></div>
          </div>
          <q-separator />
          <div class="text-subtitle2">Règle de trois — conversion stock</div>
          <div class="text-caption text-grey-7 q-mb-sm">
            Le stock est toujours en unité de base (pièces ou kg). Ces champs définissent combien de stock est retiré par carton ou sac vendu.
          </div>
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <q-input
                v-model.number="form.qte_par_carton"
                label="Pièces par carton"
                type="number"
                outlined
                :step="1"
                :min="0"
                hint="Ex. savon : 10 pièces/carton → 2 cartons vendus = -20 pièces"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model.number="form.qte_par_sac"
                label="Kg par sac"
                type="number"
                outlined
                :step="0.001"
                :min="0"
                hint="Ex. riz : 50 kg/sac → 2 sacs vendus = -100 kg"
              />
            </div>
          </div>
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <q-input
                v-model.number="form.stock"
                :label="`Stock (${uniteLabel(form.unite_vente)})`"
                type="number"
                outlined
                :step="qtyStep(form.unite_vente)"
                :min="0"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model.number="form.stock_min"
                :label="`Stock min (${uniteLabel(form.unite_vente)})`"
                type="number"
                outlined
                :step="qtyStep(form.unite_vente)"
                :min="0"
              />
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Annuler" v-close-popup />
          <q-btn color="primary" label="Enregistrer" :loading="saving" @click="save" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showCategories" :maximized="$q.screen.xs">
      <q-card class="dialog-card" style="min-width: 400px">
        <q-card-section class="row items-center">
          <div class="text-h6 col">Catégories</div>
          <q-btn flat round icon="close" v-close-popup />
        </q-card-section>
        <q-card-section>
          <div class="row q-col-gutter-sm q-mb-md">
            <div class="col"><q-input v-model="newCategorie" label="Nouvelle catégorie" outlined dense @keyup.enter="addCategorie" /></div>
            <div class="col-auto"><q-btn color="primary" icon="add" label="Ajouter" :loading="savingCat" @click="addCategorie" /></div>
          </div>
          <q-list bordered separator>
            <q-item v-for="cat in categories" :key="cat.id">
              <q-item-section>
                <q-item-label>{{ cat.nom }}</q-item-label>
                <q-item-label caption>{{ cat.nb_produits }} produit(s)</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn flat dense icon="delete" color="negative" @click="removeCategorie(cat)" />
              </q-item-section>
            </q-item>
            <q-item v-if="!categories.length">
              <q-item-section class="text-grey-6">Aucune catégorie</q-item-section>
            </q-item>
          </q-list>
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
  UNITE_OPTIONS, isKg, uniteLabel, unitePrixSuffix,
  formatQuantite, qtyStep
} from '../../utils/unites'

export default {
  name: 'ProduitsPage',
  setup () {
    const $q = useQuasar()
    const rows = ref([])
    const categories = ref([])
    const loading = ref(false)
    const saving = ref(false)
    const savingCat = ref(false)
    const dialog = ref(false)
    const showCategories = ref(false)
    const form = ref({})
    const searchQuery = ref('')
    const filterCategorie = ref(null)
    const newCategorie = ref('')

    const columns = [
      { name: 'nom', label: 'Nom', field: 'nom', align: 'left', sortable: true },
      { name: 'categorie_nom', label: 'Catégorie', field: 'categorie_nom', align: 'left' },
      { name: 'reference', label: 'Réf.', field: 'reference', align: 'left' },
      { name: 'unite_vente', label: 'Vente', field: 'unite_vente', align: 'center' },
      { name: 'prix_vente', label: 'Prix unitaire', field: row => formatMontant(row.prix_vente), align: 'right' },
      { name: 'prix_grossiste', label: 'Prix grossiste', field: row => formatMontant(row.prix_grossiste), align: 'right' },
      { name: 'date_peremption', label: 'Péremption', field: 'date_peremption', align: 'left' },
      { name: 'stock', label: 'Stock', field: 'stock', align: 'center' },
      { name: 'actions', label: '', field: 'actions', align: 'center' }
    ]

    const categorieOptions = computed(() =>
      categories.value.map(c => ({ label: c.nom, value: c.id }))
    )

    function formatDate (d) {
      if (!d) return ''
      return new Date(d).toLocaleDateString('fr-FR')
    }

    function isExpired (d) {
      return new Date(d) < new Date(new Date().toDateString())
    }

    async function loadCategories () {
      const { data } = await api.get('/categories')
      categories.value = data
    }

    async function load () {
      loading.value = true
      try {
        const params = {}
        if (searchQuery.value?.trim()) params.q = searchQuery.value.trim()
        if (filterCategorie.value) params.categorie_id = filterCategorie.value
        const { data } = await api.get('/produits', { params })
        rows.value = data
      } finally {
        loading.value = false
      }
    }

    function openDialog (row = null) {
      form.value = row ? { ...row, date_peremption: row.date_peremption?.slice?.(0, 10) || row.date_peremption || null } : {
        nom: '', reference: '', code_barre: '',
        prix_achat: 0, prix_vente: 0, prix_grossiste: 0, prix_carton: 0, prix_sac: 0,
        qte_par_carton: 0, qte_par_sac: 0,
        unite_vente: 'piece',
        stock: 0, stock_min: 0,
        categorie_id: null,
        date_peremption: null
      }
      dialog.value = true
    }

    async function save () {
      if (!form.value.nom?.trim()) {
        $q.notify({ type: 'warning', message: 'Le nom est obligatoire' })
        return
      }
      saving.value = true
      try {
        const payload = { ...form.value, date_peremption: form.value.date_peremption || null }
        if (form.value.id) await api.put(`/produits/${form.value.id}`, payload)
        else await api.post('/produits', payload)
        dialog.value = false
        await load()
        $q.notify({ type: 'positive', message: 'Produit enregistré' })
      } catch (err) {
        $q.notify({ type: 'negative', message: err.response?.data?.message || 'Erreur' })
      } finally {
        saving.value = false
      }
    }

    function remove (row) {
      $q.dialog({ title: 'Supprimer', message: `Supprimer ${row.nom} ?`, cancel: true })
        .onOk(async () => {
          await api.delete(`/produits/${row.id}`)
          await load()
        })
    }

    async function addCategorie () {
      if (!newCategorie.value?.trim()) return
      savingCat.value = true
      try {
        await api.post('/categories', { nom: newCategorie.value.trim() })
        newCategorie.value = ''
        await loadCategories()
        $q.notify({ type: 'positive', message: 'Catégorie ajoutée' })
      } catch (err) {
        $q.notify({ type: 'negative', message: err.response?.data?.message || 'Erreur' })
      } finally {
        savingCat.value = false
      }
    }

    function removeCategorie (cat) {
      $q.dialog({
        title: 'Supprimer la catégorie',
        message: `Supprimer « ${cat.nom} » ? Les produits associés n'auront plus de catégorie.`,
        cancel: true
      }).onOk(async () => {
        await api.delete(`/categories/${cat.id}`)
        await loadCategories()
        await load()
      })
    }

    onMounted(async () => {
      await loadCategories()
      await load()
    })

    return {
      rows, columns, loading, saving, savingCat, dialog, showCategories, form,
      searchQuery, filterCategorie, newCategorie, categories, categorieOptions,
      UNITE_OPTIONS, isKg, uniteLabel, unitePrixSuffix, formatQuantite, qtyStep,
      formatMontant, formatDate, isExpired,
      openDialog, save, remove, load, addCategorie, removeCategorie
    }
  }
}
</script>
