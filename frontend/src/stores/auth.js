import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token') || null,
    activeGrossiste: JSON.parse(localStorage.getItem('activeGrossiste') || 'null')
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isBoss: (state) => state.user?.role === 'boss',
    isEmploye: (state) => state.user?.role === 'employe',
    activeGrossisteId: (state) => state.activeGrossiste?.id || state.user?.grossiste_id || null
  },

  actions: {
    async login (credentials) {
      const { data } = await api.post('/auth/login', credentials)
      this.setSession(data)
      return data
    },

    async register (payload) {
      const { data } = await api.post('/auth/register', payload)
      this.setSession(data)
      return data
    },

    async fetchMe () {
      const { data } = await api.get('/auth/me')
      this.user = data
      localStorage.setItem('user', JSON.stringify(data))
      return data
    },

    setSession ({ token, user }) {
      this.token = token
      this.user = user
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      if (user.role === 'employe' && user.grossiste_id) {
        this.enterGrossiste({
          id: user.grossiste_id,
          nom: user.grossiste_nom
        })
      }
    },

    enterGrossiste (grossiste) {
      this.activeGrossiste = grossiste
      localStorage.setItem('activeGrossiste', JSON.stringify(grossiste))
      localStorage.setItem('activeGrossisteId', grossiste.id)
    },

    leaveGrossiste () {
      this.activeGrossiste = null
      localStorage.removeItem('activeGrossiste')
      localStorage.removeItem('activeGrossisteId')
    },

    logout () {
      this.user = null
      this.token = null
      this.activeGrossiste = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('activeGrossiste')
      localStorage.removeItem('activeGrossisteId')
    }
  }
})
