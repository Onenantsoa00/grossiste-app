<template>
  <q-page class="flex flex-center auth-page">
    <q-card class="q-pa-lg auth-card" style="width: 450px; max-width: 95vw">
      <q-card-section class="text-center">
        <div class="text-h5 text-primary">Créer un compte Boss</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="onSubmit" class="q-gutter-md">
          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-input
                v-model="form.prenom"
                label="Prénom"
                outlined
                :rules="[req]"
              />
            </div>
            <div class="col-6">
              <q-input v-model="form.nom" label="Nom" outlined :rules="[req]" />
            </div>
          </div>
          <q-input
            v-model="form.email"
            label="Email"
            type="email"
            outlined
            :rules="[req]"
          />
          <q-input v-model="form.telephone" label="Téléphone" outlined />
          <q-input
            v-model="form.password"
            label="Mot de passe"
            :type="showPassword ? 'text' : 'password'"
            outlined
            :rules="[req]"
          >
            <template #append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>
          <q-input
            v-model="form.confirm"
            label="Confirmer"
            :type="showConfirm ? 'text' : 'password'"
            outlined
            :rules="[confirmRule]"
          >
            <template #append>
              <q-icon
                :name="showConfirm ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showConfirm = !showConfirm"
              />
            </template>
          </q-input>

          <q-btn
            type="submit"
            label="S'inscrire"
            color="primary"
            class="full-width"
            :loading="loading"
          />
          <div class="text-center">
            <router-link to="/login" class="text-primary"
              >Déjà un compte ? Se connecter</router-link
            >
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useAuthStore } from "stores/auth";

export default {
  name: "RegisterPage",
  setup() {
    const $q = useQuasar();
    const router = useRouter();
    const auth = useAuthStore();
    const loading = ref(false);
    const showPassword = ref(false);
    const showConfirm = ref(false);
    const form = ref({
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      password: "",
      confirm: "",
    });

    const req = (val) => !!val || "Champ requis";
    const confirmRule = (val) =>
      val === form.value.password || "Les mots de passe ne correspondent pas";

    async function onSubmit() {
      loading.value = true;
      try {
        await auth.register({
          nom: form.value.nom,
          prenom: form.value.prenom,
          email: form.value.email,
          telephone: form.value.telephone,
          password: form.value.password,
        });
        $q.notify({ type: "positive", message: "Compte créé avec succès" });
        showPassword.value = false;
        showConfirm.value = false;
        router.push("/boss");
      } catch (err) {
        $q.notify({
          type: "negative",
          message: err.response?.data?.message || "Erreur",
        });
      } finally {
        loading.value = false;
      }
    }

    return {
      form,
      loading,
      req,
      confirmRule,
      showPassword,
      showConfirm,
      onSubmit,
    };
  },
};
</script>
