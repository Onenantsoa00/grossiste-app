<template>
  <q-page class="flex flex-center auth-page">
    <q-card class="q-pa-lg auth-card">
      <q-card-section class="text-center">
        <div class="text-h5">Mot de passe oublié</div>
      </q-card-section>
      <q-card-section>
        <q-form
          v-if="!resetLink"
          @submit.prevent="onSubmit"
          class="q-gutter-md"
        >
          <q-input
            v-model="email"
            label="Email"
            type="email"
            outlined
            :rules="[(val) => !!val || 'Email requis']"
          />
          <q-btn
            type="submit"
            label="Envoyer le lien"
            color="primary"
            class="full-width"
            :loading="loading"
          />
          <div class="text-center">
            <router-link to="/login" class="text-primary"
              >Retour connexion</router-link
            >
          </div>
        </q-form>
        <div v-else class="q-gutter-md">
          <q-banner rounded class="bg-positive text-white">
            Si cet email existe, un lien de réinitialisation a été envoyé.
          </q-banner>
          <div v-if="resetLink" class="text-body2">
            <p>Utilisez ce lien pour réinitialiser votre mot de passe :</p>
            <q-input :model-value="resetLink" readonly outlined dense>
              <template #append>
                <q-btn flat dense icon="content_copy" @click="copyLink" />
              </template>
            </q-input>
            <q-btn
              color="primary"
              label="Réinitialiser maintenant"
              class="full-width q-mt-md"
              :to="resetRoute"
            />
          </div>
          <div class="text-center">
            <router-link to="/login" class="text-primary"
              >Retour connexion</router-link
            >
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { ref, computed } from "vue";
import { useQuasar } from "quasar";
import { api } from "boot/axios";

export default {
  name: "ForgotPasswordPage",
  setup() {
    const $q = useQuasar();
    const email = ref("");
    const loading = ref(false);
    const resetLink = ref("");
    const devToken = ref("");

    const resetRoute = computed(() => {
      if (devToken.value) {
        return { path: "/reset-password", query: { token: devToken.value } };
      }
      if (resetLink.value) {
        try {
          const url = new URL(resetLink.value);
          return {
            path: "/reset-password",
            query: { token: url.searchParams.get("token") },
          };
        } catch {
          return "/reset-password";
        }
      }
      return "/reset-password";
    });

    async function onSubmit() {
      loading.value = true;
      try {
        const { data } = await api.post("/auth/forgot-password", {
          email: email.value,
        });
        $q.notify({ type: "positive", message: data.message });

        if (data.reset_url) {
          resetLink.value = data.reset_url;
          devToken.value = data.dev_token || "";
        } else {
          resetLink.value = "";
        }
      } catch (err) {
        $q.notify({
          type: "negative",
          message: err.response?.data?.message || "Erreur",
        });
      } finally {
        loading.value = false;
      }
    }

    function copyLink() {
      const link = devToken.value
        ? `${window.location.origin}/reset-password?token=${devToken.value}`
        : resetLink.value;
      navigator.clipboard?.writeText(link);
      $q.notify({ type: "info", message: "Lien copié" });
    }

    return {
      email,
      loading,
      resetLink,
      devToken,
      resetRoute,
      onSubmit,
      copyLink,
    };
  },
};
</script>
