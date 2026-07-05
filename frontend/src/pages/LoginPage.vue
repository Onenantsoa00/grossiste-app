<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card class="q-pa-lg" style="width: 400px; max-width: 95vw">
      <q-card-section class="text-center">
        <div class="text-h5 text-primary">Gestion Grossiste</div>
        <div class="text-subtitle2 text-grey-7">Connexion à votre espace</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="onSubmit" class="q-gutter-md">
          <q-input
            v-model="form.email"
            label="Email"
            type="email"
            outlined
            :rules="[val => !!val || 'Email requis']"
          />
          <q-input
            v-model="form.password"
            label="Mot de passe"
            :type="showPassword ? 'text' : 'password'"
            outlined
            :rules="[val => !!val || 'Mot de passe requis']"
          >
            <template #append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <q-btn
            type="submit"
            label="Se connecter"
            color="primary"
            class="full-width"
            :loading="loading"
          />

          <div class="text-center q-gutter-sm">
            <router-link to="/forgot-password" class="text-primary">Mot de passe oublié ?</router-link>
            <div>
              <router-link to="/register" class="text-primary">Créer un compte Boss</router-link>
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth'

export default {
  name: 'LoginPage',
  setup () {
    const $q = useQuasar()
    const router = useRouter()
    const auth = useAuthStore()
    const loading = ref(false)
    const showPassword = ref(false)
    const form = ref({ email: '', password: '' })

    async function onSubmit () {
      loading.value = true
      try {
        await auth.login(form.value)
        $q.notify({ type: 'positive', message: 'Connexion réussie' })
        router.push(auth.isBoss ? '/boss' : '/employe')
      } catch (err) {
        $q.notify({
          type: 'negative',
          message: err.response?.data?.message || 'Erreur de connexion'
        })
      } finally {
        loading.value = false
      }
    }

    return { form, loading, showPassword, onSubmit }
  }
}
</script>
