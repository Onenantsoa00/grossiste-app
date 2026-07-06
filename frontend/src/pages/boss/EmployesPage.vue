<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h5 col">Gestion des employés</div>
      <q-btn
        color="primary"
        icon="add"
        label="Nouvel employé"
        @click="openDialog()"
      />
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
          <q-badge
            :color="props.row.actif ? 'positive' : 'negative'"
            :label="props.row.actif ? 'Actif' : 'Bloqué'"
          />
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            dense
            icon="edit"
            color="primary"
            @click="openDialog(props.row)"
          />
          <q-btn
            flat
            dense
            icon="lock_reset"
            color="orange"
            @click="resetPassword(props.row)"
          />
          <q-btn
            flat
            dense
            icon="delete"
            color="negative"
            @click="confirmDelete(props.row)"
          />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialog">
      <q-card style="min-width: 400px">
        <q-card-section class="text-h6"
          >{{ form.id ? "Modifier" : "Créer" }} un employé</q-card-section
        >
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.nom" label="Nom *" outlined />
          <q-input v-model="form.prenom" label="Prénom" outlined />
          <q-input v-model="form.email" label="Email *" outlined />
          <q-input v-model="form.telephone" label="Téléphone" outlined />
          <q-select
            v-model="form.grossiste_id"
            :options="grossisteOptions"
            label="Grossiste *"
            outlined
            emit-value
            map-options
          />
          <q-input
            v-if="!form.id"
            v-model="form.password"
            label="Mot de passe *"
            :type="showPassword ? 'text' : 'password'"
            outlined
          >
            <template #append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>
          <q-toggle v-if="form.id" v-model="form.actif" label="Compte actif" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Annuler" v-close-popup />
          <q-btn
            color="primary"
            label="Enregistrer"
            :loading="saving"
            @click="save"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, onMounted } from "vue";
import { useQuasar } from "quasar";
import { api } from "boot/axios";

export default {
  name: "BossEmployesPage",
  setup() {
    const $q = useQuasar();
    const rows = ref([]);
    const grossisteOptions = ref([]);
    const loading = ref(false);
    const saving = ref(false);
    const dialog = ref(false);
    const showPassword = ref(false);
    const form = ref({});

    const columns = [
      {
        name: "nom",
        label: "Nom",
        field: (row) => `${row.prenom || ""} ${row.nom}`,
        align: "left",
      },
      { name: "email", label: "Email", field: "email", align: "left" },
      {
        name: "grossiste_nom",
        label: "Grossiste",
        field: "grossiste_nom",
        align: "left",
      },
      { name: "actif", label: "Statut", field: "actif", align: "center" },
      { name: "actions", label: "Actions", field: "actions", align: "center" },
    ];

    async function load() {
      loading.value = true;
      try {
        const [employes, grossistes] = await Promise.all([
          api.get("/employes"),
          api.get("/grossistes"),
        ]);
        rows.value = employes.data;
        grossisteOptions.value = grossistes.data.map((g) => ({
          label: g.nom,
          value: g.id,
        }));
      } finally {
        loading.value = false;
      }
    }

    function openDialog(row = null) {
      form.value = row
        ? { ...row, actif: row.actif ?? true }
        : {
            nom: "",
            prenom: "",
            email: "",
            telephone: "",
            password: "",
            grossiste_id: null,
            actif: true,
          };
      showPassword.value = false;
      dialog.value = true;
    }

    async function save() {
      saving.value = true;
      try {
        if (form.value.id) {
          await api.put(`/employes/${form.value.id}`, form.value);
        } else {
          await api.post("/employes", form.value);
        }
        showPassword.value = false;
        dialog.value = false;
        await load();
        $q.notify({ type: "positive", message: "Enregistré" });
      } catch (err) {
        $q.notify({
          type: "negative",
          message: err.response?.data?.message || "Erreur",
        });
      } finally {
        saving.value = false;
      }
    }

    function resetPassword(row) {
      $q.dialog({
        title: "Réinitialiser le mot de passe",
        prompt: { model: "", type: "password", label: "Nouveau mot de passe" },
        cancel: true,
      }).onOk(async (password) => {
        await api.patch(`/employes/${row.id}/reset-password`, { password });
        $q.notify({ type: "positive", message: "Mot de passe réinitialisé" });
      });
    }

    function confirmDelete(row) {
      $q.dialog({
        title: "Supprimer",
        message: `Supprimer ${row.nom} ?`,
        cancel: true,
      }).onOk(async () => {
        await api.delete(`/employes/${row.id}`);
        await load();
      });
    }

    onMounted(load);

    return {
      rows,
      columns,
      grossisteOptions,
      loading,
      saving,
      dialog,
      form,
      showPassword,
      openDialog,
      save,
      resetPassword,
      confirmDelete,
    };
  },
};
</script>
