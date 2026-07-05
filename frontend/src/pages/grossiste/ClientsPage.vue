<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h5 col">Clients</div>
      <q-btn color="primary" icon="add" label="Ajouter" @click="openDialog()" />
    </div>

    <q-table :rows="rows" :columns="columns" row-key="id" :loading="loading" flat bordered>
      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn flat dense icon="edit" @click="openDialog(props.row)" />
          <q-btn flat dense icon="delete" color="negative" @click="remove(props.row)" />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialog">
      <q-card style="min-width: 400px">
        <q-card-section class="text-h6">{{ form.id ? 'Modifier' : 'Ajouter' }} client</q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.nom" label="Nom *" outlined />
          <q-input v-model="form.telephone" label="Téléphone" outlined />
          <q-input v-model="form.email" label="Email" outlined />
          <q-input v-model="form.adresse" label="Adresse" outlined type="textarea" />
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

export default {
  name: 'ClientsPage',
  setup () {
    const $q = useQuasar()
    const rows = ref([])
    const loading = ref(false)
    const saving = ref(false)
    const dialog = ref(false)
    const form = ref({})

    const columns = [
      { name: 'nom', label: 'Nom', field: 'nom', align: 'left' },
      { name: 'telephone', label: 'Téléphone', field: 'telephone', align: 'left' },
      { name: 'email', label: 'Email', field: 'email', align: 'left' },
      { name: 'actions', label: '', field: 'actions', align: 'center' }
    ]

    async function load () {
      loading.value = true
      try {
        const { data } = await api.get('/clients')
        rows.value = data
      } finally {
        loading.value = false
      }
    }

    function openDialog (row = null) {
      form.value = row ? { ...row } : { nom: '', telephone: '', email: '', adresse: '' }
      dialog.value = true
    }

    async function save () {
      saving.value = true
      try {
        if (form.value.id) await api.put(`/clients/${form.value.id}`, form.value)
        else await api.post('/clients', form.value)
        dialog.value = false
        await load()
      } finally {
        saving.value = false
      }
    }

    function remove (row) {
      $q.dialog({ title: 'Supprimer', message: `Supprimer ${row.nom} ?`, cancel: true })
        .onOk(async () => { await api.delete(`/clients/${row.id}`); await load() })
    }

    onMounted(load)
    return { rows, columns, loading, saving, dialog, form, openDialog, save, remove }
  }
}
</script>
