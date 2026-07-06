<template>
  <q-page class="q-pa-md page-responsive">
    <div class="text-h5 q-mb-md">Décaissements</div>

    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-4" v-for="stat in statsCards" :key="stat.label">
        <q-card class="stat-card q-pa-md">
          <div class="text-grey-7 text-caption">{{ stat.label }}</div>
          <div class="text-h6" :class="stat.color">{{ stat.value }}</div>
        </q-card>
      </div>
    </div>

    <q-card class="q-pa-md q-mb-lg">
      <div class="text-subtitle1 q-mb-md">Nouveau décaissement</div>
      <div class="row q-col-gutter-md items-end">
        <div class="col-12 col-sm-4">
          <q-select
            v-model="form.grossiste_id"
            :options="grossisteOptions"
            label="Grossiste *"
            outlined
            emit-value
            map-options
            @update:model-value="onGrossisteChange"
          />
        </div>
        <div class="col-12 col-sm-4">
          <q-input
            v-model.number="form.montant"
            label="Montant à décaisser (Ar) *"
            type="number"
            outlined
            min="0"
            step="0.01"
            :hint="grossisteSolde ? `Max : ${formatMontant(grossisteSolde.solde)}` : 'Choisissez un grossiste'"
          />
        </div>
        <div class="col-12 col-sm-4">
          <q-input v-model="form.motif" label="Motif" outlined />
        </div>
        <div v-if="grossisteSolde" class="col-12">
          <q-banner dense rounded class="bg-blue-1 text-blue-10">
            CA brut : {{ formatMontant(grossisteSolde.ca_brut) }} —
            Déjà décaissé : {{ formatMontant(grossisteSolde.total_decaisse) }} —
            <strong>Solde disponible : {{ formatMontant(grossisteSolde.solde) }}</strong>
          </q-banner>
        </div>
        <div class="col-12">
          <q-btn
            color="primary"
            icon="payments"
            label="Enregistrer le décaissement"
            :loading="saving"
            :disable="!form.grossiste_id"
            @click="save"
          />
        </div>
      </div>
    </q-card>

    <q-table
      :rows="decaissements"
      :columns="columns"
      row-key="id"
      :loading="loading"
      flat
      bordered
      :grid="$q.screen.xs"
      :pagination="{ rowsPerPage: 10 }"
    >
      <template #body-cell-montant="props">
        <q-td :props="props" class="text-negative text-weight-medium">
          - {{ formatMontant(props.row.montant) }}
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn flat dense icon="delete" color="negative" @click="remove(props.row)" />
        </q-td>
      </template>
      <template #item="props">
        <div class="q-pa-xs col-12">
          <q-card bordered flat class="q-pa-sm">
            <div class="text-negative text-weight-medium">- {{ formatMontant(props.row.montant) }}</div>
            <div class="text-caption">{{ new Date(props.row.date).toLocaleString('fr-FR') }}</div>
            <div>{{ props.row.grossiste_nom }}</div>
            <div class="text-grey-7">{{ props.row.motif || '—' }}</div>
          </q-card>
        </div>
      </template>
    </q-table>
  </q-page>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'
import { formatMontant, useDashboardStore } from 'stores/dashboard'

export default {
  name: 'DecaissementsPage',
  setup () {
    const $q = useQuasar()
    const dashboard = useDashboardStore()
    const decaissements = ref([])
    const stats = ref({ chiffre_affaires: 0, total_decaisse: 0, solde: 0 })
    const grossisteSolde = ref(null)
    const loading = ref(false)
    const saving = ref(false)
    const form = ref({ montant: null, grossiste_id: null, motif: '' })

    const columns = [
      { name: 'date', label: 'Date', field: row => new Date(row.date).toLocaleString('fr-FR'), align: 'left' },
      { name: 'montant', label: 'Montant', field: 'montant', align: 'right' },
      { name: 'grossiste_nom', label: 'Grossiste', field: 'grossiste_nom', align: 'left' },
      { name: 'motif', label: 'Motif', field: 'motif', align: 'left' },
      { name: 'actions', label: '', field: 'actions', align: 'center' }
    ]

    const grossisteOptions = computed(() =>
      (dashboard.bossGrossistes || []).map(g => ({
        label: `${g.nom} (solde : ${formatMontant((g.ca_brut ?? g.chiffre_affaires) - (g.total_decaisse || 0))})`,
        value: g.id
      }))
    )

    const statsCards = computed(() => [
      { label: 'CA global brut', value: formatMontant(stats.value.chiffre_affaires), color: 'text-primary' },
      { label: 'Total décaissé', value: formatMontant(stats.value.total_decaisse), color: 'text-negative' },
      { label: 'Solde global', value: formatMontant(stats.value.solde), color: 'text-positive' }
    ])

    async function loadGrossisteSolde (grossisteId) {
      if (!grossisteId) {
        grossisteSolde.value = null
        return
      }
      const { data } = await api.get('/decaissements/stats', { params: { grossiste_id: grossisteId } })
      grossisteSolde.value = data
    }

    async function onGrossisteChange (id) {
      form.value.montant = null
      await loadGrossisteSolde(id)
    }

    async function load () {
      loading.value = true
      try {
        const [listRes, statsRes] = await Promise.all([
          api.get('/decaissements'),
          api.get('/decaissements/stats')
        ])
        decaissements.value = listRes.data
        stats.value = statsRes.data
      } finally {
        loading.value = false
      }
    }

    async function save () {
      if (!form.value.grossiste_id) {
        $q.notify({ type: 'warning', message: 'Choisissez un grossiste' })
        return
      }
      const m = parseFloat(form.value.montant)
      if (!Number.isFinite(m) || m <= 0) {
        $q.notify({ type: 'warning', message: 'Montant invalide' })
        return
      }
      if (grossisteSolde.value && m > parseFloat(grossisteSolde.value.solde)) {
        $q.notify({ type: 'warning', message: 'Le montant dépasse le CA disponible de ce grossiste' })
        return
      }
      saving.value = true
      try {
        await api.post('/decaissements', {
          montant: m,
          grossiste_id: form.value.grossiste_id,
          motif: form.value.motif
        })
        form.value = { montant: null, grossiste_id: null, motif: '' }
        grossisteSolde.value = null
        await load()
        await dashboard.fetchBossDashboard()
        $q.notify({ type: 'positive', message: 'Décaissement enregistré — le CA du grossiste a été mis à jour' })
      } catch (err) {
        $q.notify({ type: 'negative', message: err.response?.data?.message || 'Erreur' })
      } finally {
        saving.value = false
      }
    }

    function remove (row) {
      $q.dialog({
        title: 'Supprimer',
        message: `Supprimer ce décaissement de ${formatMontant(row.montant)} ?`,
        cancel: true
      }).onOk(async () => {
        await api.delete(`/decaissements/${row.id}`)
        await load()
        if (form.value.grossiste_id) await loadGrossisteSolde(form.value.grossiste_id)
        await dashboard.fetchBossDashboard()
      })
    }

    onMounted(async () => {
      if (!dashboard.bossGrossistes.length) await dashboard.fetchBossDashboard()
      await load()
    })

    return {
      decaissements, stats, grossisteSolde, loading, saving, form, columns,
      grossisteOptions, statsCards, formatMontant, onGrossisteChange, save, remove
    }
  }
}
</script>
