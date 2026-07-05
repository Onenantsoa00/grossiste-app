<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h5 col">Produits</div>
      <q-btn color="primary" icon="add" label="Ajouter" @click="openDialog()" />
    </div>

    <q-table :rows="rows" :columns="columns" row-key="id" :loading="loading" flat bordered>
      <template #body-cell-stock="props">
        <q-td :props="props">
          <q-badge :color="props.row.stock <= props.row.stock_min ? 'negative' : 'positive'">
            {{ props.row.stock }}
          </q-badge>
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn flat dense icon="edit" @click="openDialog(props.row)" />
          <q-btn flat dense icon="delete" color="negative" @click="remove(props.row)" />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialog">
      <q-card style="min-width: 450px">
        <q-card-section class="text-h6">{{ form.id ? 'Modifier' : 'Ajouter' }} produit</q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.nom" label="Nom *" outlined />
          <q-input v-model="form.reference" label="Référence" outlined />
          <q-input v-model="form.code_barre" label="Code-barres" outlined />
          <div class="row q-col-gutter-sm">
            <div class="col-4"><q-input v-model.number="form.prix_achat" label="Prix achat" type="number" outlined /></div>
            <div class="col-4"><q-input v-model.number="form.prix_vente" label="Prix vente" type="number" outlined /></div>
            <div class="col-4"><q-input v-model.number="form.prix_grossiste" label="Prix grossiste" type="number" outlined /></div>
          </div>
          <div class="row q-col-gutter-sm">
            <div class="col-6"><q-input v-model.number="form.stock" label="Stock" type="number" outlined /></div>
            <div class="col-6"><q-input v-model.number="form.stock_min" label="Stock min" type="number" outlined /></div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Annuler" v-close-popup />
          <q-btn color="primary" label="Enregistrer" :loading="saving" @click="save" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'
import { formatMontant } from 'stores/dashboard'

export default {
  name: 'ProduitsPage',
  setup () {
    const $q = useQuasar()
    const rows = ref([])
    const loading = ref(false)
    const saving = ref(false)
    const dialog = ref(false)
    const form = ref({})

    const columns = [
      { name: 'nom', label: 'Nom', field: 'nom', align: 'left' },
      { name: 'reference', label: 'Réf.', field: 'reference', align: 'left' },
      { name: 'prix_vente', label: 'Prix vente', field: row => formatMontant(row.prix_vente), align: 'right' },
      { name: 'stock', label: 'Stock', field: 'stock', align: 'center' },
      { name: 'actions', label: '', field: 'actions', align: 'center' }
    ]

    async function load () {
      loading.value = true
      try {
        const { data } = await api.get('/produits')
        rows.value = data
      } finally {
        loading.value = false
      }
    }

    function openDialog (row = null) {
      form.value = row ? { ...row } : {
        nom: '', reference: '', code_barre: '',
        prix_achat: 0, prix_vente: 0, prix_grossiste: 0,
        stock: 0, stock_min: 0
      }
      dialog.value = true
    }

    async function save () {
      saving.value = true
      try {
        if (form.value.id) await api.put(`/produits/${form.value.id}`, form.value)
        else await api.post('/produits', form.value)
        dialog.value = false
        await load()
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

    onMounted(load)
    return { rows, columns, loading, saving, dialog, form, openDialog, save, remove }
  }
}
</script>
