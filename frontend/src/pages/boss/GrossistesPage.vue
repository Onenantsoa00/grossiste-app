<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h5 col">Gestion des grossistes</div>
      <q-btn color="primary" icon="add" label="Nouveau grossiste" @click="openDialog()" />
    </div>

    <q-table
      :rows="rows"
      :columns="columns"
      row-key="id"
      :loading="loading"
      flat
      bordered
    >
      <template #body-cell-actif="props">
        <q-td :props="props">
          <q-toggle
            :model-value="props.row.actif"
            @update:model-value="toggleActif(props.row, $event)"
          />
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn flat dense icon="edit" color="primary" @click="openDialog(props.row)" />
          <q-btn flat dense icon="delete" color="negative" @click="confirmDelete(props.row)" />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialog">
      <q-card style="min-width: 400px">
        <q-card-section class="text-h6">
          {{ form.id ? 'Modifier' : 'Créer' }} un grossiste
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.nom" label="Nom *" outlined />
          <q-input v-model="form.telephone" label="Téléphone" outlined />
          <q-input v-model="form.email" label="Email" outlined />
          <q-input v-model="form.adresse" label="Adresse" outlined type="textarea" />
          <q-input v-model="form.nif" label="NIF" outlined />
          <q-input v-model="form.stat" label="STAT" outlined />
          <q-input v-model="form.description" label="Description" outlined type="textarea" />
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
  name: 'BossGrossistesPage',
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
      { name: 'actif', label: 'Actif', field: 'actif', align: 'center' },
      { name: 'actions', label: 'Actions', field: 'actions', align: 'center' }
    ]

    async function load () {
      loading.value = true
      try {
        const { data } = await api.get('/grossistes')
        rows.value = data
      } finally {
        loading.value = false
      }
    }

    function openDialog (row = null) {
      form.value = row ? { ...row } : { nom: '', telephone: '', email: '', adresse: '', nif: '', stat: '', description: '' }
      dialog.value = true
    }

    async function save () {
      if (!form.value.nom) {
        $q.notify({ type: 'warning', message: 'Le nom est obligatoire' })
        return
      }
      saving.value = true
      try {
        if (form.value.id) {
          await api.put(`/grossistes/${form.value.id}`, form.value)
        } else {
          await api.post('/grossistes', form.value)
        }
        dialog.value = false
        await load()
        $q.notify({ type: 'positive', message: 'Enregistré' })
      } catch (err) {
        $q.notify({ type: 'negative', message: err.response?.data?.message || 'Erreur' })
      } finally {
        saving.value = false
      }
    }

    async function toggleActif (row, actif) {
      await api.patch(`/grossistes/${row.id}/toggle`, { actif })
      row.actif = actif
    }

    function confirmDelete (row) {
      $q.dialog({
        title: 'Supprimer',
        message: `Supprimer ${row.nom} ?`,
        cancel: true,
        persistent: true
      }).onOk(async () => {
        await api.delete(`/grossistes/${row.id}`)
        await load()
        $q.notify({ type: 'positive', message: 'Supprimé' })
      })
    }

    onMounted(load)

    return { rows, columns, loading, saving, dialog, form, openDialog, save, toggleActif, confirmDelete }
  }
}
</script>
