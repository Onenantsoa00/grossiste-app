<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card class="q-pa-lg auth-card">
      <q-card-section class="text-center">
        <div class="text-h5">Nouveau mot de passe</div>
        <div class="text-caption text-grey-7 q-mt-sm">Choisissez un nouveau mot de passe pour votre compte</div>
      </q-card-section>
      <q-card-section>
        <q-form @submit.prevent="onSubmit" class="q-gutter-md">
          <q-input
            v-model="password"
            label="Nouveau mot de passe"
            :type="showPwd ? 'text' : 'password'"
            outlined
            :rules="[val => val?.length >= 6 || 'Minimum 6 caractères']"
          >
            <template #append>
              <q-icon :name="showPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showPwd = !showPwd" />
            </template>
          </q-input>
          <q-input
            v-model="confirmPassword"
            label="Confirmer le mot de passe"
            :type="showPwd ? 'text' : 'password'"
            outlined
            :rules="[val => val === password || 'Les mots de passe ne correspondent pas']"
          />
          <q-btn type="submit" label="Réinitialiser" color="primary" class="full-width" :loading="loading" :disable="!token" />
          <div class="text-center">
            <router-link to="/login" class="text-primary">Retour connexion</router-link>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

export default {
  name: 'ResetPasswordPage',
  setup () {
    const $q = useQuasar()
    const route = useRoute()
    const router = useRouter()
    const token = ref(route.query.token || '')
    const password = ref('')
    const confirmPassword = ref('')
    const showPwd = ref(false)
    const loading = ref(false)

    onMounted(() => {
      if (!token.value) {
        $q.notify({ type: 'warning', message: 'Lien de réinitialisation invalide' })
      }
    })

    async function onSubmit () {
      if (!token.value) return
      loading.value = true
      try {
        await api.post('/auth/reset-password', {
          token: token.value,
          password: password.value
        })
        $q.notify({ type: 'positive', message: 'Mot de passe réinitialisé avec succès' })
        router.push('/login')
      } catch (err) {
        $q.notify({ type: 'negative', message: err.response?.data?.message || 'Erreur' })
      } finally {
        loading.value = false
      }
    }

    return { token, password, confirmPassword, showPwd, loading, onSubmit }
  }
}
</script>
