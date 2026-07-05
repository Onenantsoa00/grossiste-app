<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card class="q-pa-lg" style="width: 400px; max-width: 95vw">
      <q-card-section class="text-center">
        <div class="text-h5">Mot de passe oublié</div>
      </q-card-section>
      <q-card-section>
        <q-form @submit.prevent="onSubmit" class="q-gutter-md">
          <q-input v-model="email" label="Email" type="email" outlined :rules="[val => !!val || 'Email requis']" />
          <q-btn type="submit" label="Envoyer le lien" color="primary" class="full-width" :loading="loading" />
          <div class="text-center">
            <router-link to="/login" class="text-primary">Retour connexion</router-link>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

export default {
  name: 'ForgotPasswordPage',
  setup () {
    const $q = useQuasar()
    const email = ref('')
    const loading = ref(false)

    async function onSubmit () {
      loading.value = true
      try {
        const { data } = await api.post('/auth/forgot-password', { email: email.value })
        $q.notify({ type: 'positive', message: data.message })
      } catch (err) {
        $q.notify({ type: 'negative', message: err.response?.data?.message || 'Erreur' })
      } finally {
        loading.value = false
      }
    }

    return { email, loading, onSubmit }
  }
}
</script>
